'use client';

import React, { useEffect } from 'react';
import {
  Typography,
  CircularProgress,
  Box,
  Grid,
  Button,
  Paper
} from '@mui/material';

import { useNostrBookList } from '@/hooks/useNostrBookList';

import { DEFAULT_RELAYS } from '@/constants/nostr';

import BookCard from '@/components/ui/BookCard';

interface BooksFilter {
  authors?: string[];
  tags?: string[]; 
  limit?: number;
  lifecycle?: string;
}

interface BookGridProps {
  filter?: BooksFilter;
  onSelectBook?: (bookId: string, authorPubkey: string) => void;
  sectionTitle?: string;
}

const BookGrid: React.FC<BookGridProps> = ({ filter, onSelectBook, sectionTitle }) => {
  const {
    books,
    isLoading,
    error,
    fetchBooks,
  } = useNostrBookList({
    relays: DEFAULT_RELAYS,
    initialFetch: false,
  });

  const { lifecycle, limit } = filter || {};

  useEffect(() => {
		fetchBooks('all', limit);
	}, [fetchBooks, limit]);

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

  const filteredBooks = lifecycle ? books.filter((book) => {
    return book.lifecycle === lifecycle
  }) : books;
  
  return (
    <Paper elevation={24} sx={{backgroundColor: '#8b6914', padding: 4}}>
      {sectionTitle && (
        <Box className="bg-[#eae86f] min-h-20 max-w-80 flex justify-center items-center rounded-md flex-col my-8">
          <Typography color="black" variant="h3" component="h3">{sectionTitle}</Typography>
        </Box>
      )}
      <Grid container spacing={2}>
        {filteredBooks.map((book) => {
          const { title, description, authorPubkey, fsmId: bookId, authorName } = book;

          return (
            <Grid key={bookId} size={{xs: 12, sm: 6, md: 4, lg: 3}} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={onSelectBook ? () => onSelectBook(bookId, authorPubkey) : () => {}}>
                <BookCard id={bookId} authorName={authorName} authorPubkey={authorPubkey} title={title} description={description} />
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default BookGrid;
