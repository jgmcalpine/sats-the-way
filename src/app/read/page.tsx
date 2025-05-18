'use client';
import { useRouter } from 'next/navigation';

import { Box, Link, Typography } from '@mui/material';

import LayoutWrapper from '@/components/LayoutWrapper';
import BookShelf from '@/components/ui/BookShelf';

const SECTIONS = [
  { id: 0, title: 'Free' },
  { id: 1, title: 'Favorites' },
  { id: 2, title: 'All' },
];

export default function ReadPage() {
  const router = useRouter();

  const handleReadBook = (bookId: string, authorPubkey: string) => {
    const readUrl = `/read/${authorPubkey}/${bookId}`;
    router.push(readUrl);
  };

  return (
    <LayoutWrapper>
      <Box className="flex justify-center items-center pt-16 md:pt-0">
        <Typography variant="h4" component="h1" className="mb-2">
          Find your own adventure
        </Typography>
      </Box>
      <Box component="header" className="bg-white py-6 md:px-8 scroll-smooth">
        <Box className="mx-auto flex flex-col md:flex-row md:items-center">
          <Box className="md:w-1/2 mb-4 md:mb-0">
            <Typography variant="body1" className="text-gray-700">
              We (will one day) have lots of stories to choose from. For now, you can scroll down to
              see all options or jump to your favorite section on the right.
            </Typography>
          </Box>

          {/* Section links */}
          <Box className="md:w-1/2 flex flex-col md:justify-center md:items-center">
            <Typography variant="h6">Sections:</Typography>
            <nav aria-label="Jump to section">
              <ul className="flex flex-wrap flex-col justify-start md:justify-end">
                {SECTIONS.map(section => (
                  <li key={section.id}>
                    <Link href={`#${section.id}`} underline="hover">
                      <Typography variant="h6">{section.title}</Typography>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Box>
        </Box>
      </Box>
      <Box className="flex flex-col gap-8 md:gap-24 justify-center items-center h-full min-h-screen pb-48 w-full">
        <BookShelf
          id="0"
          sectionTitle="Free"
          filter={{ limit: 8, isFree: true, bookIds: ['1d8b77da-eadf-4485-bbe4-dac624f27eae'] }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
        <BookShelf
          id="1"
          sectionTitle="Favorites"
          filter={{ limit: 8, bookIds: ['ca0248b6-d222-42fc-81e4-21bd60c07db1'] }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
        <BookShelf
          id="2"
          sectionTitle="All"
          filter={{ limit: 8 }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
      </Box>
    </LayoutWrapper>
  );
}
