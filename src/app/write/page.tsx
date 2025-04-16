'use client';

import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from "@/components/AuthProvider";
import { useDrafts } from '@/hooks/useDrafts';
import DraftBookList from '@/components/ui/DraftBookList';
import { BookDraftWithMetadata, ChapterDraft, BookDraft } from '@/types/drafts';
import BookEditor from "@/components/ui/BookEditor";

export default function WritePage() {
    const { currentUser, loading } = useAuth();
    const { createBookWithChapter, deleteDraft } = useDrafts();
    const [draftToEdit, setDraftToEdit] = useState<string>('')

    if (loading) return null;

    const onEditDraft = (book: BookDraftWithMetadata) => {
        setDraftToEdit(book.event.id);
    }

    const onDeleteDraft = (book: BookDraftWithMetadata) => {
        deleteDraft(book.event);
    }
    const handleNewBook = async ({title, description, dedication}: { title: string, description?: string, dedication?: string }) => {
        try {
            // Create book data (excluding last_modified and created_at)
            const bookId = crypto.randomUUID();
            const bookData: Omit<BookDraft, 'last_modified' | 'created_at'> = {
            id: bookId,
            draft_type: 'book',
            series_type: 'book',
            media_type: 'text',
            title,
            author: currentUser?.pubkey || '',
            language: 'english',
            description,
            dedication,
            chapters: [] // This will be populated by createBookWithChapter
            };
    
            // Create initial chapter data (excluding last_modified, created_at, and book)
            const chapterId = crypto.randomUUID();
            const initialChapterData: Omit<ChapterDraft, 'last_modified' | 'created_at' | 'book'> = {
                id: chapterId,
                draft_type: 'chapter',
                entry_type: 'chapter',
                media_type: 'text',
                body: '',
                paid: false,
                position: 0,
            };
    
            // Create book with initial chapter
            const { bookEvent, chapterEvent } = await createBookWithChapter(bookData, initialChapterData);
            console.log('Created book:', bookEvent);
            console.log('Created chapter:', chapterEvent);
            
            setDraftToEdit(bookEvent.id);
            
            return { bookEvent, chapterEvent };
        } catch (error) {
            console.error('Error creating book:', error);
        }
    }


    if (!currentUser) {
        return <div>Connect with nip-07 to create your own adventures!</div>
    }

    return (
        <div className="flex flex-col justify-center items-center h-full min-h-screen">
            <DraftBookList handleDeleteDraft={onDeleteDraft} handleEditDraft={onEditDraft} />
            <BookEditor onCreateBook={handleNewBook} bookEventId={draftToEdit} />
        </div>
    )
}