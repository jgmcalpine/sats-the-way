'use client';

import { useState , useEffect} from "react";
import { CircularProgress, Box, Typography } from '@mui/material';

import { useAuth } from "@/components/AuthProvider";
import { BookData } from "@/components/ui/BookShelf";
import FsmBuilder from "@/components/ui/FsmBuilder";
import WriteHeader from "@/components/ui/WriteHeader";
import type { State, FsmData } from '@/hooks/useFsm';
import BookGrid from "@/components/ui/BookGrid";

import { BookListItem } from '@/hooks/useNostrBookList'
import { useNostrBookEditor } from '@/hooks/useNostrBookEditor';

export default function WritePage() {
    const [bookNaddr, setBookNaddr] = useState<string | null>(null);
    const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null); // Get this from your auth context/login state
    const { currentUser, loading } = useAuth();
    const [showEditor, setShowEditor] = useState(false);
    const [fsmData, setFsmData] = useState<FsmData | null>(null);
    const [currentBookId, setCurrentBookId] = useState<string | null>(null);
    const [currentBookTitle, setCurrentBookTitle] = useState<string | undefined>(undefined);
    const [isLoadingPage, setIsLoadingPage] = useState(true);

    const {
        isConnecting,
        isProcessing, // Use this for button loading states
        createAndLoadNewBook,
        loadBook,
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

    useEffect(() => {
        if (bookNaddr && typeof bookNaddr === 'string' && currentUserPubkey) {
            setIsLoadingPage(true);
            setShowEditor(true); // Assume showing editor if loading specific book
            loadBook(bookNaddr)
                .then(result => {
                    if (result) {
                        setFsmData(result.fsmData);
                        setCurrentBookId(result.bookId);
                        // Attempt to get title from loaded data (might need adjustment based on loadBook return)
                         const metadata = result.fsmData // You might need to adjust loadBook to return metadata title separately
                        //  setCurrentBookTitle(metadata?.title);
                    } else {
                        // Handle book not found - maybe redirect or show error
                        setShowEditor(false); // Go back to header if load fails?
                    }
                })
                .finally(() => setIsLoadingPage(false));
        } else {
            setIsLoadingPage(false); // Not loading a specific book initially
        }
    }, [bookNaddr, loadBook, currentUserPubkey]); // Depend on identifier and load function availability

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
     const handleSaveChapter = async (chapterData: State) => {
        if (!currentBookId || !currentUserPubkey || isProcessing) return;
        await saveChapter(chapterData, currentBookId, currentUserPubkey);
        // Optionally show success feedback (e.g., snackbar)
    };

    const handleSaveAll = async (data: FsmData) => {
         if (!currentBookId || !currentUserPubkey || isProcessing) return;
         // Find current title from data if possible (user might have edited it in FsmBuilder if you added that field)
         // For now, using the state variable:
         await saveAllProgress(data, currentBookId, currentBookTitle, currentUserPubkey);
         // Update local FSM data state AFTER save? Or assume component state is source of truth?
         // setFsmData(data); // Update local state to match what was saved
         // Optionally show success feedback
    };

    const handlePublish = async (data: FsmData) => {
        if (!currentBookId || !currentUserPubkey || isProcessing) return;
        const { title } = data
        await publishBook(data, currentBookId, title, currentUserPubkey);
         // Optionally show success feedback
    };

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    if (isConnecting || isLoadingPage || loading) {
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
                    <BookGrid filter={{authors: currentUserPubkey ? [currentUserPubkey] : [], status: 'draft'}} />
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