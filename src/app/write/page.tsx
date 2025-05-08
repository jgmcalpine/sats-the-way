'use client';

import { useState , useEffect} from "react";
import { CircularProgress, Box, Typography } from '@mui/material';

import { useAuth } from "@/components/AuthProvider";
import FsmBuilder from "@/components/ui/FsmBuilder";
import WriteHeader from "@/components/ui/WriteHeader";
import type { FsmState, FsmData } from '@/types/fsm';
import BookGrid from "@/components/ui/BookGrid";

import { useNostrBookEditor } from '@/hooks/useNostrBookEditor';

export default function WritePage() {
    const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null);
    const { currentUser, loading } = useAuth();
    const [showEditor, setShowEditor] = useState(false);
    const [fsmData, setFsmData] = useState<FsmData | null>(null);
    const [currentBookId, setCurrentBookId] = useState<string | null>(null);
    const [currentBookTitle, setCurrentBookTitle] = useState<string | undefined>(undefined);

    const {
        isConnecting,
        isProcessing,
        createAndLoadNewBook,
        saveChapter,
        saveAllProgress,
        publishBook,
    } = useNostrBookEditor(currentUserPubkey);

    useEffect(() => {
        const getPubkey = async () => {
            if (window.nostr) {
                try {
                    const pubkey = await window.nostr.getPublicKey();
                    setCurrentUserPubkey(pubkey);
                    
                } catch (e) { console.error("Could not get pubkey:", e); }
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
            setCurrentBookTitle('Untitled Adventure'); // Default title
            setShowEditor(true);
        }
    };

     // These handlers now directly call the hook methods
     const handleSaveChapter = async (chapterData: FsmState) => {
        if (!currentBookId || !currentUserPubkey || isProcessing) return;
        await saveChapter(chapterData, currentBookId, currentUserPubkey);
        // Optionally show success feedback (e.g., snackbar)
    };

    const handleSaveAll = async (data: FsmData) => {
         if (!currentBookId || !currentUserPubkey || isProcessing) return;
         // Find current title from data if possible (user might have edited it in FsmBuilder if you added that field)
         // For now, using the state variable:
         await saveAllProgress(data, currentBookId, currentUserPubkey);
         // Update local FSM data state AFTER save? Or assume component state is source of truth?
         // setFsmData(data); // Update local state to match what was saved
         // Optionally show success feedback
    };

    const handlePublish = async (data: FsmData) => {
        if (!currentBookId || !currentUserPubkey || isProcessing) return;
        await publishBook(data);
         // Optionally show success feedback
    };

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    if (isConnecting || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{isConnecting ? 'Connecting to Nostr relays...' : 'Loading book data...'}</Typography>
            </Box>
        );
    }
    
    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen pb-48">
            {!showEditor || !fsmData ? (
                <Box>
                    <WriteHeader onStartWriting={handleStartAdventure} />
                    <BookGrid filter={{authors: currentUserPubkey ? [currentUserPubkey] : [], lifecycle: 'draft', limit: 8}} />
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
        </div>
    )
}