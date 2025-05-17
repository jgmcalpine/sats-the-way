import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useWallet } from '@/components/WalletProvider';
import { fetchLnurlInvoice, fetchLnurlPayParams, getPayUrl } from '@/lib/lightning/helpers';
import { FsmState, Transition } from '@/types/fsm';

export interface BookMetadata {
  title: string;
  bookId: string; // for invoice endpoint
  authorPubkey?: string;
  authorName?: string;
  coverImage?: string;
  description?: string;
  genre?: string;
  publishDate?: string;
  lnurlp?: string;
}

export interface NostrBookReaderProps {
  currentChapter: FsmState;
  bookMetadata: BookMetadata;
  onTransitionSelect: (transition: Transition) => void;
  onPreviousChapter?: (chapterId: string) => void;
}

const BookContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(4, 'auto'),
  height: '80vh',
  maxHeight: '800px',
  backgroundColor: theme.palette.background.default,
}));

const BookPage = styled(Paper)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px 0 0 4px',
  backgroundColor: theme.palette.background.paper,
}));

const LeftPage = styled(BookPage)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.grey[100],
}));

const RightPage = styled(BookPage)(({ theme }) => ({
  borderLeft: 'none',
  borderRadius: '0 4px 4px 0',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: '#FDF5E6',
  color: '#333333',
}));

const ChapterContent = styled(Box)(({ theme }) => ({
  overflow: 'auto',
  marginBottom: theme.spacing(2),
  flexGrow: 1,
  fontSize: '1.1rem',
  lineHeight: '1.6',
}));

const ChoiceButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  textAlign: 'left',
  justifyContent: 'flex-start',
  textTransform: 'none',
  display: 'block',
  width: '100%',
}));

const NostrBookReader: React.FC<NostrBookReaderProps> = ({
  currentChapter,
  bookMetadata,
  onTransitionSelect,
  onPreviousChapter,
}) => {
  const { state: walletState, connect: connectWallet, payInvoice } = useWallet();

  const [invoice, setInvoice] = useState<string>('');
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [showNipWarning, setShowNipWarning] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<Transition | null>(null);
  const pendingRef = useRef<{ bolt11: string; transition: Transition } | null>(null);

  useEffect(() => {
    if (pendingTransition && pendingRef.current) {
      pendingRef.current.transition = pendingTransition;
    }
  }, [pendingTransition]);

  const handlePayment = useCallback(async () => {
    const pending = pendingRef.current!;
    setIsLoadingInvoice(true);
    try {
      // 1) pay
      await payInvoice(pending.bolt11);
      // 2) navigate
      onTransitionSelect(pending.transition);
    } finally {
      // 3) cleanup
      pendingRef.current = null;
      setIsLoadingInvoice(false);
    }
  }, [onTransitionSelect, payInvoice]);

  const fetchInvoice = useCallback(
    async (transition: Transition) => {
      setIsLoadingInvoice(true);

      try {
        if (!transition.price || transition.price <= 0 || !bookMetadata?.lnurlp) {
          // Free transition — proceed immediately
          onTransitionSelect(transition);
          return;
        }

        const lnurlp = bookMetadata.lnurlp;
        // 1. Decode LNURL
        const payUrl = await getPayUrl(lnurlp);
        // 2. Fetch pay params
        const payParams = await fetchLnurlPayParams(payUrl);
        // 3. Prepare comment if allowed
        let comment = undefined;
        if (payParams.commentAllowed && payParams.commentAllowed > 0) {
          comment = `${bookMetadata.bookId}:${transition.targetStateId}`;
          console.warn('What to do with comment: ', comment);
        }

        // 4. Fetch BOLT11 invoice
        const invoiceResponse = await fetchLnurlInvoice(payParams.callback, transition.price);
        const bolt11 = invoiceResponse.pr;
        // 5. Show payment modal with QR code
        setInvoice(bolt11);
        return bolt11;
      } catch (err) {
        console.error('Error during transition payment flow:', err);
      } finally {
        setIsLoadingInvoice(false);
      }
    },
    [bookMetadata.bookId, onTransitionSelect, bookMetadata.lnurlp]
  );

  const onChoiceClick = useCallback(
    async (transition: Transition) => {
      if (!transition.price || transition.price === 0) {
        return onTransitionSelect(transition);
      }

      // 1) fetch the BOLT11
      setIsLoadingInvoice(true);
      const bolt11 = await fetchInvoice(transition);
      setIsLoadingInvoice(false);
      if (!bolt11) {
        throw new Error('error loading invoice');
      }

      // stash it for handlePayment()
      pendingRef.current = { bolt11, transition };
      setPendingTransition(transition);

      if (walletState.status === 'ready') {
        // auto‑pay path
        await handlePayment();
      } else {
        // show the modal so user can connect
        setPaymentModalOpen(true);
      }
    },
    [fetchInvoice, onTransitionSelect, walletState.status, handlePayment]
  );

  return (
    <>
      <Snackbar
        open={showNipWarning}
        autoHideDuration={6000}
        onClose={() => setShowNipWarning(false)}
      >
        <Alert severity="info" onClose={() => setShowNipWarning(false)}>
          Progress won’t be saved until you connect your Nostr identity.
        </Alert>
      </Snackbar>
      <BookContainer>
        <Box sx={{ display: 'flex', height: '100%', width: '100%', boxShadow: 4 }}>
          <Box sx={{ width: { xs: '0', md: '33.33%' }, height: '100%' }}>
            <LeftPage elevation={3}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {bookMetadata.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  by {bookMetadata.authorName || bookMetadata.authorPubkey}
                </Typography>

                {bookMetadata.description && (
                  <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                    {bookMetadata.description}
                  </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h5" sx={{ mb: 2 }}>
                  {currentChapter.name}
                </Typography>

                {bookMetadata.genre && (
                  <Typography variant="body2" color="text.secondary">
                    Genre: {bookMetadata.genre}
                  </Typography>
                )}

                {Boolean(currentChapter.price) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Entry Fee: {currentChapter.price}
                  </Typography>
                )}
              </Box>

              {/* Previous Chapter Button */}
              {currentChapter.previousStateId && onPreviousChapter && (
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => onPreviousChapter(currentChapter?.previousStateId || '')}
                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                >
                  Previous Chapter
                </Button>
              )}
            </LeftPage>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '66.67%' }, height: '100%' }}>
            <RightPage elevation={3}>
              <ChapterContent>
                <Box className="whitespace-pre-wrap text-base leading-relaxed">
                  {currentChapter.content}
                </Box>
              </ChapterContent>

              <Divider sx={{ my: 2 }} />

              {/* Choices for Next Chapter */}
              <Box>
                {currentChapter.isEndState ? (
                  <Card variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                    <CardContent>
                      <Typography variant="h6" color="text.secondary">
                        The End
                      </Typography>
                      <Typography variant="body2">
                        Congratulations! You&apos;ve reached the end of this story.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {currentChapter.transitions.length !== 0 && (
                      <Typography variant="subtitle1" gutterBottom>
                        What will you do next?
                      </Typography>
                    )}
                    {currentChapter.transitions.map(transition => (
                      <ChoiceButton
                        key={transition.id}
                        variant="outlined"
                        onClick={() => onChoiceClick(transition)}
                        endIcon={<ArrowForwardIcon />}
                      >
                        <Typography variant="body1">
                          {transition.choiceText}
                          {Boolean(transition.price) && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              ({transition.price} sats)
                            </Typography>
                          )}
                        </Typography>
                      </ChoiceButton>
                    ))}
                  </>
                )}
              </Box>
            </RightPage>
          </Box>
        </Box>
      </BookContainer>

      {/* Payment Modal */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {walletState.status === 'ready' ? 'Confirm Payment' : 'Connect Wallet'}
        </DialogTitle>
        <DialogContent>
          {isLoadingInvoice ? (
            <CircularProgress />
          ) : walletState.status !== 'ready' ? (
            <Button variant="contained" onClick={connectWallet} fullWidth>
              Connect Lightning Wallet
            </Button>
          ) : (
            <>
              <Typography>
                Pay {pendingRef?.current?.transition?.price || ''} sats to unlock?
              </Typography>
              <QRCodeSVG value={invoice} size={200} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentModalOpen(false)} disabled={isLoadingInvoice}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              // 1) ask wallet to connect
              await connectWallet();
              // 2) now walletState.status === 'ready', so pay + navigate
              await handlePayment();
              // 3) hide modal
              setPaymentModalOpen(false);
            }}
            disabled={isLoadingInvoice || walletState.status !== 'ready'}
          >
            {walletState.status === 'ready' ? 'Pay Now' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NostrBookReader;
