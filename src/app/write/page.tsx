'use client';

import { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import DraftBookList from '@/components/ui/DraftBookList';
import { BookData } from "@/components/ui/BookShelf";
import BookEditor from "@/components/ui/BookEditor";
import FsmBuilder from "@/components/ui/FsmBuilder";
import WriteHeader from "@/components/ui/WriteHeader";

import { mockFsmData, mockBookId, mockAuthorPubkey } from '@/constants/mock';
import type { State, FsmData } from '@/components/ui/FsmBuilder'; // Adjust path if needed

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const [showEditor, setShowEditor] = useState(false);
    const [draftToEdit, setDraftToEdit] = useState<BookData | null>(null)

    if (loading) return null;

    // Handler for saving the entire book (metadata + all chapters)
  const handleSaveProgress = async (data: FsmData) => {
    console.log("SAVING ENTIRE BOOK:", data);
    // 1. Construct Kind 31111 (Book Metadata) event using data.startStateId etc.
    //    Use mockBookId and mockAuthorPubkey for 'd' and 'a' tags.
    // 2. For each state in data.states:
    //    Construct Kind 31112 (Chapter) event using state data.
    //    Use state.id for 'd' tag.
    //    Use "31111:<mockAuthorPubkey>:<mockBookId>" for 'a' tag.
    // 3. Sign and publish all events.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async
    console.log("Entire book save simulated.");
     // Maybe update initialData state here if fetching fresh data after save
  };

  // Handler for publishing the book
  const handlePublish = async (data: FsmData) => {
    console.log("PUBLISHING BOOK:", data);
    // Similar to save, but might:
    // 1. Add/update 'publishedAt' in Kind 31111 content.
    // 2. Publish to more relays.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate async
    console.log("Book publish simulated.");
  };

  // Handler for saving just one chapter
  const handleSaveChapter = async (chapterData: State) => {
    console.log("SAVING CHAPTER:", chapterData);
    // 1. Construct Kind 31112 (Chapter) event using chapterData.
    // 2. Use chapterData.id for the 'd' tag.
    // 3. Use "31111:<mockAuthorPubkey>:<mockBookId>" for the 'a' tag.
    // 4. Sign and publish *this single* event.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async
    console.log("Chapter save simulated.");
     // Maybe update initialData state here if fetching fresh data after save
  };

    const onEditDraft = (book: BookData | undefined) => {
        if (!book) return;
        setDraftToEdit(book);
    }

    const handleStartNewAdventure = () => {
        console.log("Starting a new adventure!");
        // Here you would typically:
        // 1. Generate a new unique bookId and chapterId for the initial state.
        // 2. Create a minimal FsmData object with one starting chapter.
        // 3. Navigate to the editor page OR toggle the editor's visibility.
        setShowEditor(true);
        // You might need to pass newly generated IDs/data to the FsmBuilder below
    };

    const handleSave = async () => { console.log("Save triggered"); };

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen pb-48">
            {/* <DraftBookList handleEditDraft={onEditDraft} /> */}
            {/* {draftToEdit && <BookEditor book={draftToEdit} onNewChapter={() => console.log("new chaptering")} onSave={() => {console.log("ON SAVE")}} />} */}
            {!showEditor ? (
                 <WriteHeader onStartWriting={handleStartNewAdventure} />
            ) : (
                <>
                    {/* Render the builder, potentially passing initial empty data */}
                    <FsmBuilder
                        // You'd generate a unique bookId and authorPubkey here
                        bookId={"new-book-" + Date.now()}
                        authorPubkey={"your-user-pubkey"} // Get this from user session/login
                        // initialData={/* Pass minimal starting data */}
                        onSaveProgress={handleSave}
                        onPublish={handlePublish}
                        onSaveChapter={handleSaveChapter}
                    />
                </>
            )}
        </div>
    )
}