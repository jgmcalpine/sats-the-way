import { QRCodeSVG } from 'qrcode.react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
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
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useNip07 } from '@/hooks/nostr/useNip07';
import { fetchLnurlInvoice, fetchLnurlPayParams, getPayUrl } from '@/lib/lightning/helpers';
import { FsmState, Transition } from '@/types/fsm';

export interface BookMetadata {
  title: string;
  authorPubkey?: string;
  authorName?: string;
  coverImage?: string;
  description?: string;
  genre?: string;
  publishDate?: string;
  lnurlp?: string;
  bookId: string; // for invoice endpoint
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
  backgroundColor: theme.palette.grey[50],
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

const LoadingBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const NostrBookReader: React.FC<NostrBookReaderProps> = ({
  currentChapter,
  bookMetadata,
  onTransitionSelect,
  onPreviousChapter,
}) => {
  const { pubkey: readerPubkey, connect } = useNip07();
  const [invoice, setInvoice] = useState<string>('');
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<Transition | null>(null);
  // const [paymentPolling, setPaymentPolling] = useState<NodeJS.Timeout | null>(null);
  const pendingTransitionRef = useRef<Transition | null>(null);

  // Update ref whenever pendingTransition changes
  useEffect(() => {
    pendingTransitionRef.current = pendingTransition;
  }, [pendingTransition]);

  // function startPollingForPayment(invoice: string) {
  //   if (paymentPolling) clearInterval(paymentPolling);

  //   const interval = setInterval(async () => {
  //       try {
  //           const paid = await checkInvoicePaid(invoice);
  //           console.log("is it paid: ", paid)
  //           if (paid) {
  //               clearInterval(interval);
  //               setPaymentPolling(null);
  //               setPaymentModalOpen(false);
  //               console.log("what is pending transition: ", pendingTransitionRef.current)
  //               if (pendingTransitionRef.current) {
  //                   console.log("We are here in pending transition", pendingTransitionRef.current)
  //                   onTransitionSelect(pendingTransitionRef.current);
  //                   setPendingTransition(null);
  //               }
  //           }
  //       } catch (err) {
  //           console.error('Polling error:', err);
  //       }
  //   }, 5000); // check every 5 seconds

  //   setPaymentPolling(interval);
  // }

  // async function checkInvoicePaid(invoice: string): Promise<boolean> {
  //   // Call LNURL-pay service / invoice checker
  //   // OR monitor via own service
  //   console.log("invoice: ", invoice)
  //   // For now, let's simulate always true after delay
  //   return true;
  // }

  const fetchInvoice = useCallback(
    async (transition: Transition) => {
      if (!readerPubkey) return;

      setLoadingInvoice(true);

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
        setPaymentModalOpen(true);
        return bolt11;
      } catch (err) {
        console.error('Error during transition payment flow:', err);
      } finally {
        setLoadingInvoice(false);
      }
    },
    [bookMetadata.bookId, readerPubkey]
  );

  const onChoiceClick = useCallback(
    async (transition: Transition) => {
      if (transition.price && transition.price > 0) {
        if (!readerPubkey) {
          try {
            await connect();
          } catch (err) {
            console.error('NIP-07 connect failed', err);
            return;
          }
        }
        setPendingTransition(transition);
        await fetchInvoice(transition);
        // if (invoice) {
        //   startPollingForPayment(invoice);
        // }
      } else {
        onTransitionSelect(transition);
      }
    },
    [fetchInvoice, onTransitionSelect, readerPubkey, connect]
  );

  const handleModalClose = () => {
    setPaymentModalOpen(false);
    setInvoice('');
  };

  return (
    <>
      <BookContainer>
        <Box sx={{ display: 'flex', height: '100%', width: '100%', boxShadow: 4 }}>
          <Box sx={{ width: '33.33%', height: '100%' }}>
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

          <Box sx={{ width: '66.67%', height: '100%' }}>
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
                        You&apos;ve reached the end of this story.
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
      <Dialog open={paymentModalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Pay to Unlock Chapter</DialogTitle>
        <DialogContent>
          {loadingInvoice ? (
            <LoadingBox>
              <CircularProgress />
            </LoadingBox>
          ) : (
            <>
              <p>Scan with your Lightning Wallet:</p>
              <QRCodeSVG value={invoice} size={256} />
              <p className="bolt11-string">{invoice}</p>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} disabled={loadingInvoice}>
            Cancel
          </Button>
          {pendingTransitionRef.current && (
            <Button
              variant="outlined"
              onClick={() => {
                onTransitionSelect(pendingTransitionRef.current!);
                setPaymentModalOpen(false);
              }}
              disabled={loadingInvoice}
            >
              I paid
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NostrBookReader;
