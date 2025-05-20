'use client';

import {
  Alert,
  Box,
  CircularProgress,
  Link,
  List,
  ListItem,
  Snackbar,
  Typography,
} from '@mui/material';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import LayoutWrapper from '@/components/LayoutWrapper';
import BookShelf from '@/components/ui/BookShelf';
import FsmBuilder from '@/components/ui/FsmBuilder';
import WriteHeader from '@/components/ui/WriteHeader';
import type { FsmData, FsmState } from '@/types/fsm';

import { useNostrBookEditor } from '@/hooks/useNostrBookEditor';

export default function WritePage() {
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null);
  const { loading } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [fsmData, setFsmData] = useState<FsmData | null>(null);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const {
    isConnecting,
    isProcessing,
    createAndLoadNewBook,
    saveChapter,
    saveAllProgress,
    publishBook,
    loadBook,
  } = useNostrBookEditor(currentUserPubkey);

  useEffect(() => {
    const getPubkey = async () => {
      if (window.nostr) {
        try {
          const pubkey = await window.nostr.getPublicKey();
          setCurrentUserPubkey(pubkey);
        } catch (e) {
          console.error('Could not get pubkey:', e);
        }
      }
    };
    getPubkey();
  }, []);

  const handleStartAdventure = async () => {
    if (isProcessing || !currentUserPubkey) return;
    const result = await createAndLoadNewBook();
    if (result) {
      setFsmData(result.initialFsmData);
      setCurrentBookId(result.bookId);
      setShowEditor(true);
    }
  };

  // These handlers now directly call the hook methods
  const handleSaveChapter = async (chapterData: FsmState) => {
    if (!currentBookId || !currentUserPubkey || isProcessing) return;
    await saveChapter(chapterData, currentBookId, currentUserPubkey);
    setSaveSuccess(true);
  };

  const handleLoadBook = async (bookId: string, authorPubkey: string) => {
    const loadedBook = await loadBook(bookId, authorPubkey);
    if (loadedBook?.fsmData) {
      setFsmData(loadedBook.fsmData);
      setShowEditor(true);
      setCurrentBookId(loadedBook.bookId);
    }
  };

  const handleSaveAll = async (book: FsmData) => {
    if (isProcessing) return;
    await saveAllProgress(book);
    setFsmData(book);
    setSaveSuccess(true);
  };

  const handlePublish = async (data: FsmData) => {
    if (!currentBookId || !currentUserPubkey || isProcessing) return;
    await publishBook(data);
    setPublishSuccess(true);
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { x: 0.5, y: 0.5 }, // start at mid‐center
    });
  };

  if (!currentUserPubkey) {
    return (
      <LayoutWrapper>
        <Box className="flex flex-col gap-8 h-full w-full">
          <Typography
            className="flex justify-center items-center"
            variant="h3"
            component="h1"
            color="primary"
            fontFamily="Georgia"
          >
            Please connect a Nostr signer
          </Typography>
          <Box className="flex flex-col gap-4 justify-start">
            <Typography variant="body1">
              Connecting with Nostr allows us to create events (data) to keep your books and
              chapters around. We do not store any data, we simply create and broadcast events to
              public relays (servers) and then get that data back when we need it.
            </Typography>
            <Typography variant="body1">
              If you do not want to connect with Nostr, you can still{' '}
              {<Link color="secondary" href="/read">{` read.`}</Link>}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1">
              Do your own research, but we have used these, they are open source, and they do not
              share your private keys.
            </Typography>
            <List>
              <ListItem>
                <Link
                  href="https://github.com/getAlby/lightning-browser-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="secondary"
                >
                  Alby
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="https://github.com/fiatjaf/nos2x"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="secondary"
                >
                  Nos2x
                </Link>
              </ListItem>
            </List>
          </Box>
          <Box>
            <Typography variant="body1">
              As always do your own research. For very quick lightning setup we have used{' '}
              <Link color="secondary" underline="hover" href="https://www.coinos.io">
                coinos.io
              </Link>{' '}
              and found it very user friendly. If you are just testing the application or dipping
              your toes into lightning with small amounts, this is a simple way to experience it.
              Sign up (no email required), set your username and you have a lnurl-pay address (i.e.
              username@coinos.io). Enter that when you create your story, and you can receive
              bitcoin when users pass a paywall.
            </Typography>
          </Box>
        </Box>
      </LayoutWrapper>
    );
  }

  if (isConnecting || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          {isConnecting ? 'Connecting to Nostr relays...' : 'Loading book data...'}
        </Typography>
      </Box>
    );
  }

  return (
    <LayoutWrapper>
      <div className="flex flex-col justify-center items-center h-full min-h-screen pb-48 w-full">
        {!showEditor || !fsmData ? (
          <Box className="w-full flex flex-col gap-8">
            <WriteHeader onStartWriting={handleStartAdventure} />
            {currentUserPubkey ? (
              <Box className="flex flex-col gap-8">
                <BookShelf
                  sectionTitle="Drafts"
                  onSelectBook={(id, authorPubkey) => handleLoadBook(id, authorPubkey)}
                  filter={{
                    authors: currentUserPubkey ? [currentUserPubkey] : [],
                    lifecycle: 'draft',
                    limit: 8,
                  }}
                />
                <BookShelf
                  sectionTitle="Published"
                  onSelectBook={(id, authorPubkey) => handleLoadBook(id, authorPubkey)}
                  filter={{
                    authors: currentUserPubkey ? [currentUserPubkey] : [],
                    lifecycle: 'published',
                    limit: 8,
                  }}
                />
              </Box>
            ) : null}
          </Box>
        ) : (
          <>
            <FsmBuilder
              initialData={fsmData}
              onSaveProgress={handleSaveAll}
              onPublish={handlePublish}
              onSaveChapter={handleSaveChapter}
            />
          </>
        )}
        <Snackbar
          open={saveSuccess}
          autoHideDuration={3000}
          onClose={() => setSaveSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            pt: theme => theme.spacing(8),
            pr: theme => theme.spacing(2),
          }}
        >
          <Alert onClose={() => setSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Progress saved successfully!
          </Alert>
        </Snackbar>
        <Snackbar
          open={publishSuccess}
          autoHideDuration={3000}
          onClose={() => setPublishSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            pt: theme => theme.spacing(8),
            pr: theme => theme.spacing(2),
          }}
        >
          <Alert onClose={() => setPublishSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Book published successfully!
          </Alert>
        </Snackbar>
      </div>
    </LayoutWrapper>
  );
}
