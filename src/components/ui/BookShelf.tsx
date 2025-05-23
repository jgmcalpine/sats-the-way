'use client';

import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Box, Button, CircularProgress, Grid, Paper, Tooltip, Typography } from '@mui/material';
import React, { useEffect } from 'react';

import { useNostrBookList } from '@/hooks/useNostrBookList';

import { DEFAULT_RELAYS } from '@/constants/nostr';

import BookCard from '@/components/ui/BookCard';

interface BooksFilter {
  authors?: string[];
  tags?: string[];
  limit?: number;
  lifecycle?: string;
  isFree?: boolean;
  bookIds?: string[];
}

interface BookShelfProps {
  filter?: BooksFilter;
  onSelectBook?: (bookId: string, authorPubkey: string) => void;
  sectionTitle?: string;
  id?: string;
}

const BookShelf: React.FC<BookShelfProps> = ({ filter, onSelectBook, sectionTitle, id }) => {
  const { books, isLoading, error, fetchBooks } = useNostrBookList({
    relays: DEFAULT_RELAYS,
    initialFetch: false,
  });

  const { lifecycle, limit, isFree, bookIds } = filter || {};

  useEffect(() => {
    fetchBooks('all', bookIds, limit);
  }, [fetchBooks, limit, bookIds]);

  if (isLoading) {
    return (
      <Box className="flex h-64 w-full items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    // Improve error handling
    return null;
  }

  if (!isLoading && books.length === 0) {
    return (
      <Box className="flex h-64 w-full items-center justify-center">
        <Typography variant="body1" color="textSecondary">
          No books found.
        </Typography>
      </Box>
    );
  }

  let filteredBooks = books;

  if (lifecycle) {
    filteredBooks = filteredBooks.filter(book => book.lifecycle === lifecycle);
  }

  if (isFree) {
    filteredBooks = filteredBooks.filter(book => book.minCost === 0);
  }

  if (limit) {
    filteredBooks = filteredBooks.slice(0, limit);
  }

  return (
    <Paper
      id={id}
      elevation={24}
      sx={{
        background: 'linear-gradient(to bottom, #8b5e34 0%, #6d4c28 100%)',
        padding: 4,
        position: 'relative',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
        width: '100%',
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {sectionTitle && (
        <Box
          sx={{
            position: 'relative',
            maxWidth: '300px',
            transform: `rotate(${Math.random() * 6 - 3}deg)`,
          }}
        >
          <Box
            className="flex justify-center items-center rounded-lg my-8 py-3 px-4"
            sx={{
              background: 'linear-gradient(135deg, #d4be8e 0%, #e8d9a0 50%, #d4be8e 100%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.3)',
              border: '2px solid #c4ae7e',
              position: 'relative',
            }}
          >
            <Typography
              color="#5c4934"
              variant="h3"
              component="h1"
              sx={{
                fontFamily: 'serif',
                fontWeight: 'bold',
                textShadow: '1px 1px 0 rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.5px',
                textAlign: 'center',
              }}
            >
              {sectionTitle}
            </Typography>
            {sectionTitle !== 'Free' && (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-start' }}>
                <Tooltip title="All prices in satoshis represent the total cost of the cheapest path from start to finish. Anyone can read free until they hit a paywall (set by the author.)">
                  <InfoOutlineIcon fontSize="small" />
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 2,
          width: '100%',
          px: 2,
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#5c4934',
            borderRadius: '4px',
          },
          maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
        }}
        onWheel={e => {
          if (e.deltaY !== 0) {
            const container = e.currentTarget;
            container.scrollLeft += e.deltaY;
          }
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            flexWrap: 'nowrap',
            width: 'max-content',
            minWidth: '100%',
            pr: 4,
            pt: 4,
            gap: 2,
            '&::after': {
              content: '""',
              display: 'block',
              width: '24px',
              flexShrink: 0,
            },
          }}
        >
          {filteredBooks.map(book => {
            const { title, minCost, authorPubkey, fsmId: bookId, authorName } = book;

            return (
              <Grid
                key={bookId}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '250px',
                  flexShrink: 0,
                  flexGrow: 0,
                }}
              >
                <Button
                  onClick={onSelectBook ? () => onSelectBook(bookId, authorPubkey) : () => {}}
                  sx={{
                    padding: 0,
                    width: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <BookCard
                    id={bookId}
                    authorName={authorName}
                    authorPubkey={authorPubkey}
                    title={title}
                    minCost={minCost}
                  />
                </Button>
              </Grid>
            );
          })}
          {filteredBooks.length === 0 && (
            <Box className="w-full h-full min-h-[300px] bg-white rounded-lg flex items-center justify-center">
              <Typography variant="body1">{`No ${sectionTitle || ''} books found. Get started above.`}</Typography>
            </Box>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default BookShelf;
