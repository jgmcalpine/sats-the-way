'use client';

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useDrafts } from '@/hooks/useDrafts';
import DraftBookList from '@/components/ui/DraftBookList';
import { BookDraftWithMetadata } from '@/types/drafts';
import BookEditor from "@/components/ui/BookEditor";

const BASE_FREE_DRAFT_CHAPTER = {
    book: null,
    paid: false,
    published: false
}

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const [draftToEdit, setDraftToEdit] = useState<BookDraftWithMetadata | null>(null)

    if (loading) return null;

    const handleEditDraft = (draft: BookDraftWithMetadata) => {
        console.log("should be editing this draftL ", draft);
        setDraftToEdit(draft);
    }

    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen">
            <DraftBookList handleEditDraft={handleEditDraft} />
            This is where we will write
            <BookEditor bookId={draftToEdit?.draft?.id} />
        </div>
    )
}