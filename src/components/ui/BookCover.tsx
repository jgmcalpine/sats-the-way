import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface Chapter {
    fee: number | null;
  }
  
  interface BookProps {
    title: string;
    author: string;
    description: string;
    chapters: Chapter[];
    handleClick: () => void;
  }

const BookCover: React.FC<BookProps> = ({ title, author, handleClick }) => {
  return (
    <Paper
      elevation={6}
      className="cursor-pointer transform transition-transform duration-300 hover:scale-105 w-64 h-96 flex flex-col justify-between bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg border-r border-b border-gray-300 shadow-lg"
      onClick={handleClick}
      sx={{
        position: 'relative',
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0) 1px)',
        backgroundSize: '5px 100%'
      }}
    >
      {/* Book spine effect */}
      <Box
        className="absolute left-0 top-0 w-6 h-full bg-gradient-to-r from-blue-400 to-blue-200"
        sx={{
          borderTopLeftRadius: '4px',
          borderBottomLeftRadius: '4px',
          boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.1)'
        }}
      />

      {/* Book content */}
      <Box className="flex flex-col items-center justify-center text-center p-6 h-full z-10">
        <Typography
          variant="h4"
          component="h2"
          className="mb-6 font-bold text-gray-800"
          sx={{
            fontFamily: '"Playfair Display", serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {title}
        </Typography>
        
        <Typography
          variant="subtitle1"
          className="mt-auto italic text-gray-700"
          sx={{
            fontFamily: '"Playfair Display", serif'
          }}
        >
          by {author}
        </Typography>
      </Box>

      {/* Book page effect */}
      <Box
        className="absolute right-0 bottom-0 w-full h-full pointer-events-none"
        sx={{
          backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 20%)',
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '4px'
        }}
      />
    </Paper>
  );
};

export default BookCover;