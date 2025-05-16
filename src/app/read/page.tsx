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
          filter={{ limit: 8, isFree: true, bookIds: ['1d8b77da-eadf-4485-bbe4-dac624f27eae'] }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
        <BookShelf
          sectionTitle="Favorites"
          filter={{ limit: 8, bookIds: ['ca0248b6-d222-42fc-81e4-21bd60c07db1'] }}
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
