'use client';

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useDrafts } from '@/hooks/useDrafts';
import DraftBookList from '@/components/ui/DraftBookList';
import { BookDraftWithMetadata } from '@/types/drafts';
import BookEditor from "@/components/ui/BookEditor";

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const { createDraft } = useDrafts();
    const [draftToEdit, setDraftToEdit] = useState<string | null>(null)

    if (loading) return null;

    const handleEditDraft = (draft: BookDraftWithMetadata) => {
        setDraftToEdit(draft.draft?.id);
    }

    const handleNewBook = async () => {
        const newDraftBook = await createDraft({
            id: '777',
            draft_type: 'book',
            series_type: 'book',
            media_type: 'text',
            title: '',
            language: 'english',
            author: currentUser?.pubkey || '',
            chapters: [],
            published: false,
            last_modified: new Date().getTime()
        });

        setDraftToEdit(newDraftBook.id);
    }

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen">
            <DraftBookList handleEditDraft={handleEditDraft} />
            <BookEditor onCreateBook={handleNewBook} bookId={draftToEdit} />
        </div>
    )
}