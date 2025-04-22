'use client';

import React, { useState } from 'react';
import { Box, Container, Paper } from '@mui/material';

import BookCover from '@/components/ui/BookCover';
import BookBackModal from '@/components/ui/BookBackModal';

// Reuse the existing types
interface Chapter {
  fee: number | null;
  id: number | null;
}

export interface BookData {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: Chapter[];
}

interface BookshelfProps {
  books: BookData[];
  onChooseBook?: (bookId: string) => void;
}

const Bookshelf: React.FC<BookshelfProps> = ({ books, onChooseBook }) => {
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [isBackCoverModalOpen, setIsBackCoverModalOpen] = useState<boolean>(false);
  
  // Handle book click to open modal
  const handleBookClick = (book: BookData) => {
    setSelectedBook(book);
    if (onChooseBook) {
        onChooseBook(book.id)
    } else {
        setIsBackCoverModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsBackCoverModalOpen(false);
  };

  const handleChooseBook = () => {
    if (selectedBook && onChooseBook) {
      onChooseBook(selectedBook.id);
    }
    setIsBackCoverModalOpen(false);
  };

  return (
    <Container className="max-w-screen-xl mx-auto" maxWidth={false} disableGutters>
      {/* Bookshelf container with wood effect */}
      <Paper
        elevation={3}
        className="w-full p-2 rounded-sm"
        sx={{
          backgroundColor: '#d2b48c', // Base tan color for wood
          backgroundImage: `
            linear-gradient(90deg, rgba(160,120,80,0.3) 0%, rgba(210,180,140,0) 20%, rgba(210,180,140,0) 80%, rgba(160,120,80,0.3) 100%),
            linear-gradient(0deg, rgba(160,120,80,0.4) 0%, rgba(210,180,140,0) 10%, rgba(210,180,140,0) 90%, rgba(160,120,80,0.4) 100%),
            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(140,100,60,0.05)' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
          `,
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.1)',
          border: '8px solid #8B4513',
          borderRadius: '4px',
        }}
      >
        {/* Shelf grid */}
        <Box 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4"
          sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '12px',
              backgroundColor: '#8B4513',
              boxShadow: '0 -2px 5px rgba(0,0,0,0.2)'
            }
          }}
        >
          {books.map((book) => (
            <Box key={book.id} className="flex justify-center">
              <BookCover
                title={book.title}
                author={book.author}
                description={book.description}
                chapters={book.chapters}
                handleClick={() => handleBookClick(book)}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Book modal */}
      {selectedBook && isBackCoverModalOpen && (
        <BookBackModal
          open={isBackCoverModalOpen}
          onClose={handleCloseModal}
          description={selectedBook.description}
          chapters={selectedBook.chapters}
          readBook={handleChooseBook}
        />
      )}
    </Container>
  );
};

export default Bookshelf;