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
    // Optionally show success feedback
  };

  if (!currentUserPubkey) {
    return (
      <LayoutWrapper>
        <Box className="flex flex-col gap-8 h-full w-full">
          <Typography className="flex justify-center items-center" variant="h4">
            Please connect a Nostr signer
          </Typography>
          <Box className="flex flex-col gap-4 justify-start">
            <Typography variant="body1">
              Connecting with Nostr allows us to create events (data) to keep your books and
              chapters around. We do not store any data, we simply create and broadcast events to
              public relays (servers) and then get that data back when we need it.
            </Typography>
            <Typography variant="body1">
              If you do not want to connect with Nostr, you can still read any of the free books in{' '}
              {<Link href="/read">{` read.`}</Link>}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1">
              Do your own research, but we have used these at times and they are open source
            </Typography>
            <List>
              <ListItem>
                <Link
                  href="https://github.com/getAlby/lightning-browser-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Alby
                </Link>
              </ListItem>
              <ListItem>
                <Link
                  href="https://github.com/fiatjaf/nos2x"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nos2x
                </Link>
              </ListItem>
            </List>
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Progress saved successfully!
          </Alert>
        </Snackbar>
      </div>
    </LayoutWrapper>
  );
}
