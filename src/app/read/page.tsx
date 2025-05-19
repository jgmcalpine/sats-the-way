'use client';
import { useRouter } from 'next/navigation';

import { Box, Button, Container, Link, List, ListItem, Typography } from '@mui/material';

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
      <Typography variant="h3" component="h1" color="primary" className="text-center" gutterBottom>
        Find your own adventure
      </Typography>
      <Box component="header" className="bg-white py-6 md:px-8 w-full" sx={{ boxShadow: 1 }}>
        <Container maxWidth="lg" className="mx-auto">
          <Box className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            <Box className="w-full md:w-1/2">
              <Typography variant="body1" className="text-gray-800 text-base md:text-lg" paragraph>
                We (will one day) have lots of stories to choose from. For now, you can scroll down
                to see all options or jump to your favorite section.
              </Typography>
            </Box>

            <Box className="w-full md:w-1/2">
              <Typography
                variant="body1"
                id="section-nav-heading"
                className="mb-2 font-medium text-lg"
              >
                Sections:
              </Typography>

              <nav aria-labelledby="section-nav-heading" className="w-full">
                <List
                  component="ul"
                  aria-label="Section navigation"
                  className="flex flex-wrap md:flex-nowrap flex-row gap-2"
                >
                  {SECTIONS.map(section => (
                    <ListItem key={section.id} component="li" disablePadding>
                      <Button
                        component={Link}
                        variant="outlined"
                        size="small"
                        color="secondary"
                        className="text-sm md:text-base"
                        aria-label={`Jump to ${section.title} section`}
                        onClick={e => {
                          e.preventDefault();
                          const element = document.getElementById(String(section.id));
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        sx={{
                          borderRadius: '20px',
                          padding: '4px 12px',
                          minWidth: '100px',
                        }}
                      >
                        {section.title}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </nav>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box className="flex flex-col gap-8 md:gap-24 justify-center items-center h-full min-h-screen pb-48 w-full">
        <BookShelf
          id="0"
          sectionTitle="Free"
          filter={{ limit: 8, isFree: true, bookIds: ['637aa093-f86d-4d7f-801d-550a3d71ab19'] }}
          onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)}
        />
        <BookShelf
          id="1"
          sectionTitle="Favorites"
          filter={{ limit: 8, bookIds: ['0d17f746-ad70-42d2-8742-69c11d55cc38'] }}
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
