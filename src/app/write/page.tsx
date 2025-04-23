'use client';

import { useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import DraftBookList from '@/components/ui/DraftBookList';
import { BookData } from "@/components/ui/BookShelf";
import BookEditor from "@/components/ui/BookEditor";

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const [draftToEdit, setDraftToEdit] = useState<BookData | null>(null)

    if (loading) return null;

    const onEditDraft = (book: BookData | undefined) => {
        if (!book) return;
        setDraftToEdit(book);
    }

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen pb-48">
            <DraftBookList handleEditDraft={onEditDraft} />
            {draftToEdit && <BookEditor book={draftToEdit} onNewChapter={() => console.log("new chaptering")} onSave={() => {console.log("ON SAVE")}} />}
        </div>
    )
}