'use client';

import React, { useEffect } from 'react';
import {
  Typography,
  CircularProgress,
  Box,
  Grid
} from '@mui/material';

import { useNostrBookList } from '@/hooks/useNostrBookList';

import { DEFAULT_RELAYS } from '@/constants/nostr';

import BookCard from '@/components/ui/BookCard';

interface BooksFilter {
  authors?: string[];
  tags?: string[]; 
  limit?: number;
  status?: string;
}

interface BookGridProps {
  filter?: BooksFilter;
}

const BookGrid: React.FC<BookGridProps> = ({ filter }) => {
  const {
    books,
    isLoading,
    error,
    fetchBooks,
  } = useNostrBookList({
    relays: DEFAULT_RELAYS,
    initialFetch: false,
  });

  const { status } = filter || {};

  useEffect(() => {
		fetchBooks('all');
	}, [fetchBooks]);

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

  const filteredBooks = status ? books.filter((book) => {
    return book.status === status
  }) : books;

  return (
    <Box className="p-4">
      <Grid container spacing={2}>
        {filteredBooks.map((book) => {
          const { title, description, authorPubkey, bookId, coverImage } = book;

          return (
            <Grid key={bookId} size={{xs: 12, sm: 6, md: 4, lg: 3}}>
              <BookCard id={bookId} author={authorPubkey} title={title} description={description} coverArtUrl={coverImage}  />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BookGrid;
