import React, { useMemo } from 'react';
import { Card, Typography, Box } from '@mui/material';

// Type definition for the Book props
interface BookCardProps {
  id: string | number;
  title: string;
  authorPubkey?: string;
  authorName?: string;
  description?: string;
  coverArtUrl?: string;
  width?: number;
  height?: number;
}

// Function to generate a random light color
const getRandomLightColor = (): string => {
  // Generate random light RGB values (between 180-240 for lightness)
  const r = Math.floor(Math.random() * 60) + 180;
  const g = Math.floor(Math.random() * 60) + 180;
  const b = Math.floor(Math.random() * 60) + 180;
  
  return `rgb(${r}, ${g}, ${b})`;
};

const BookCard: React.FC<BookCardProps> = ({
  title,
  authorPubkey,
  description,
  authorName,
  coverArtUrl,
  width = 200,
  height = 300,
}) => {
  // Generate a random background color if no cover art is provided
  const backgroundColor = useMemo(() => getRandomLightColor(), []);
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Book spine effect */}
      <div 
        className="absolute left-0 top-0 h-full w-4 rounded-l-sm z-10"
        style={{ 
          backgroundColor: coverArtUrl ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)',
          transform: 'skewY(-15deg) translateY(5px)'
        }}
      />
      
      {/* Book bottom edge effect */}
      <div 
        className="absolute left-4 bottom-0 right-0 h-4 rounded-br-sm"
        style={{ 
          backgroundColor: coverArtUrl ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)',
          transform: 'skewX(-15deg) translateX(-5px)'
        }}
      />
      
      {/* Main book cover */}
      <Card
        className="absolute left-0 top-0 overflow-hidden flex flex-col h-full w-full"
        sx={{
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          backgroundImage: coverArtUrl ? `url(${coverArtUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: !coverArtUrl ? backgroundColor : undefined,
          color: !coverArtUrl ? 'black' : 'white',
          position: 'relative',
          padding: 2,
        }}
      >
        {/* Overlay for better text visibility when cover art exists */}
        {coverArtUrl && (
          <Box 
            className="absolute inset-0"
            sx={{ 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
              zIndex: 0 
            }}
          />
        )}
        
        {/* Content container */}
        <Box className="relative z-10 flex flex-col h-full">
          {/* Title area */}
          <Box className="flex-grow-0 text-center mb-2">
            <Typography 
              variant="h6" 
              component="h3" 
              className="font-bold"
              sx={{ 
                textShadow: coverArtUrl ? '1px 1px 3px rgba(0,0,0,0.8)' : 'none',
                wordBreak: 'break-word'
              }}
            >
              {title}
            </Typography>
          </Box>
          
          {/* Middle space */}
          <Box className="flex-grow" />
          
          {/* Bottom content area */}
          <Box className="flex-grow-0">
            {/* Author if provided */}
            {(authorPubkey || authorName) && (
              <Typography 
                variant="subtitle1" 
                className="text-center italic mb-1"
                sx={{ 
                  textShadow: coverArtUrl ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  fontSize: '0.9rem'
                }}
              >
                by {authorName || `${authorPubkey?.slice(0, 5)}...${authorPubkey?.slice(-3)}`}
              </Typography>
            )}
            
            {/* Description if provided */}
            {description && typeof description === 'string' && (
              <Typography 
                variant="body2" 
                className="text-center mt-2"
                sx={{ 
                  textShadow: coverArtUrl ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  fontSize: '0.8rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Card>
    </div>
  );
};

export default BookCard;