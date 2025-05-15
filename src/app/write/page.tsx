'use client';

import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
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
    return <div>Connect with nip-07 to create your own adventures!</div>;
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
          <Box className="w-full">
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
