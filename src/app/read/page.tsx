'use client';
import { useRouter } from 'next/navigation';

import { Box } from '@mui/material';

import LayoutWrapper from '@/components/LayoutWrapper';
import BookShelf from '@/components/ui/BookShelf';

export default function ReadPage() {
  const router = useRouter();

  const handleReadBook = (bookId: string, authorPubkey: string) => {
    const readUrl = `/read/${authorPubkey}/${bookId}`;
    router.push(readUrl);
  };

  return (
    <LayoutWrapper>
      <Box className="flex flex-col gap-8 md:gap-24 justify-center items-center h-full min-h-screen pb-48 w-full">
        <BookShelf
          sectionTitle="Free"
          filter={{ limit: 8, isFree: true }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
        <BookShelf
          sectionTitle="All"
          filter={{ limit: 8 }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
      </Box>
    </LayoutWrapper>
  );
}
