'use client';

import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from "@/components/AuthProvider";
import { useDrafts } from '@/hooks/useDrafts';
import DraftBookList from '@/components/ui/DraftBookList';
import { BookDraftWithMetadata } from '@/types/drafts';
import { CreateBookMetadata } from '@/types/books';
import BookEditor from "@/components/ui/BookEditor";

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const { createDraft, deleteDraft } = useDrafts();
    const [draftToEdit, setDraftToEdit] = useState<string | null>(null)

    if (loading) return null;

    const onEditDraft = (book: BookDraftWithMetadata) => {
        setDraftToEdit(book.draft.id);
    }

    const onDeleteDraft = (book: BookDraftWithMetadata) => {
        deleteDraft(book.event);
    }

    const handleNewBook = async (bookMetaData: CreateBookMetadata) => {
        const { title, description, dedication } = bookMetaData;
        const newDraftBook = await createDraft({
            id: uuidv4(),
            draft_type: 'book',
            series_type: 'book',
            media_type: 'text',
            description,
            title,
            dedication,
            language: 'english',
            author: currentUser?.pubkey || '',
            chapters: [],
            last_modified: new Date().getTime()
        });

        setDraftToEdit(newDraftBook.id);
    }

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen">
            <DraftBookList handleDeleteDraft={onDeleteDraft} handleEditDraft={onEditDraft} />
            <BookEditor onCreateBook={handleNewBook} bookId={draftToEdit} />
        </div>
    )
}