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
      <Box component="header" className="bg-white py-6 px-4 md:px-8 w-full" sx={{ boxShadow: 1 }}>
        <Container maxWidth="lg" className="mx-auto">
          {/* Main heading with proper contrast and spacing */}
          <Typography
            variant="h4"
            component="h1"
            className="text-center font-bold text-2xl md:text-3xl lg:text-4xl"
            gutterBottom
            sx={{ color: 'primary.main' }}
          >
            Find your own adventure
          </Typography>

          <Box className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            {/* Descriptive text with improved readability */}
            <Box className="w-full md:w-1/2">
              <Typography variant="body1" className="text-gray-800 text-base md:text-lg" paragraph>
                We (will one day) have lots of stories to choose from. For now, you can scroll down
                to see all options or jump to your favorite section.
              </Typography>
            </Box>

            {/* Section navigation with improved accessibility */}
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
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                  {SECTIONS.map(section => (
                    <ListItem key={section.id} component="li" disablePadding className="w-auto">
                      <Button
                        component={Link}
                        href={`#${section.id}`}
                        variant="outlined"
                        size="medium"
                        color="primary"
                        className="text-sm md:text-base"
                        aria-label={`Jump to ${section.title} section`}
                        sx={{
                          borderRadius: '20px',
                          padding: '4px 12px',
                          minWidth: 'auto',
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
