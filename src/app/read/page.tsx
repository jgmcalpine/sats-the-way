'use client';
import { useRouter } from 'next/navigation';

import { Box } from '@mui/material';

import BookGrid from '@/components/ui/BookGrid';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function ReadPage() {
    const router = useRouter();

    const handleReadBook = (bookId: string, authorPubkey: string) => {
        const readUrl = `/read/${authorPubkey}/${bookId}`;
        router.push(readUrl)
    }

    return (
        <LayoutWrapper>
            <Box className="flex flex-col justify-center items-center h-full min-h-screen pb-48 w-full">
                <BookGrid sectionTitle='All Books' filter={{ limit: 8 }} onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)} />
            </Box>
        </LayoutWrapper>
    )
}