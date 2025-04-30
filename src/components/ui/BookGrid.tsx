'use client';

import React, { useEffect } from 'react';
import {
  Typography,
  CircularProgress,
  Box,
  Grid,
  Button
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
  onSelectBook?: (bookId: string, authorPubkey: string) => void;
}

const BookGrid: React.FC<BookGridProps> = ({ filter, onSelectBook }) => {
  const {
    books,
    isLoading,
    error,
    fetchBooks,
  } = useNostrBookList({
    relays: DEFAULT_RELAYS,
    initialFetch: false,
  });

  const { status, limit } = filter || {};

  useEffect(() => {
		fetchBooks('all', limit);
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
              <Button onClick={onSelectBook ? () => onSelectBook(bookId, authorPubkey) : () => {}}>
                <BookCard id={bookId} author={authorPubkey} title={title} description={description} coverArtUrl={coverImage}  />
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default BookGrid;
