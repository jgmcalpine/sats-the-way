'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Button, IconButton, Typography, List, ListItem, ListItemText, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Chapter {
  fee: number | null;
}

interface BookBackModalProps {
  open: boolean;
  onClose: () => void;
  description: string;
  chapters: Chapter[];
  readBook: () => void;
}

const BookBackModal: React.FC<BookBackModalProps> = ({ 
  open, 
  onClose, 
  description, 
  chapters, 
  readBook 
}) => {
  // Animation state
  const [animationStage, setAnimationStage] = useState<'closed' | 'animating' | 'open'>('closed');
  
  useEffect(() => {
    if (open) {
      setAnimationStage('animating');
      // Set to open after animation finishes
      const timer = setTimeout(() => setAnimationStage('open'), 500);
      return () => clearTimeout(timer);
    } else {
      setAnimationStage('closed');
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          margin: '0 auto',
          maxWidth: '400px',
          width: '100%',
          height: '600px',
          backgroundColor: animationStage === 'animating' ? 'transparent' : 'rgb(235, 245, 255)',
          backgroundImage: 'linear-gradient(to left, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0) 1px)',
          backgroundSize: '5px 100%',
          borderRadius: '8px',
          boxShadow: animationStage === 'animating' ? 'none' : '0 10px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.6s ease',
        }
      }}
    >
      {/* Container for flip animation */}
      <Box
        className="w-full h-full relative"
        sx={{
          perspective: '1500px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Book container that animates */}
        <Box
          className="w-full h-full relative bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg"
          sx={{
            transform: animationStage === 'closed' 
              ? 'rotateY(0deg)' 
              : animationStage === 'animating'
                ? 'rotateY(90deg)'
                : 'rotateY(180deg)',
            transition: 'transform 0.8s ease-in-out',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
          }}
        >
          {/* Close button */}
          <Box 
            className="absolute left-2 top-2 z-10"
            sx={{ 
              opacity: animationStage === 'open' ? 1 : 0,
              transition: 'opacity 0.3s ease',
              zIndex: 10,
            }}
          >
            <IconButton 
              onClick={onClose} 
              size="small" 
              className="text-gray-600 hover:text-gray-900"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Book spine effect */}
          <Box
            className="absolute left-0 top-0 w-6 h-full bg-gradient-to-r from-blue-400 to-blue-200"
            sx={{
              borderTopLeftRadius: '4px',
              borderBottomLeftRadius: '4px',
              boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.1)',
              display: animationStage === 'open' ? 'none' : 'block',
            }}
          />

          {/* Content - Back of book */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: animationStage === 'closed' ? 'none' : 'flex',
              flexDirection: 'column',
            }}
          >
            <DialogContent className="p-6 overflow-auto bg-gradient-to-br from-blue-50 to-blue-200 h-full flex flex-col">
              {/* Book spine effect for back */}
              <Box
                className="absolute left-0 top-0 w-6 h-full bg-gradient-to-r from-blue-400 to-blue-200"
                sx={{
                  boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.1)'
                }}
              />
              
              <Box className="mb-6 p-4">
                <Typography variant="h6" component="h3" className="text-gray-800 font-bold mb-4">
                  About this book
                </Typography>
                <Typography variant="body1" className="text-gray-700 mb-6">
                  {description}
                </Typography>
              </Box>

              <Box className="mb-4 p-4 bg-white bg-opacity-70 rounded-lg shadow-sm">
                <Typography variant="h6" component="h3" className="text-gray-800 font-bold mb-2">
                  Chapters
                </Typography>
                <List className="divide-y divide-gray-200">
                  {chapters.map((chapter, index) => (
                    <ListItem key={index} className="py-2">
                      <ListItemText 
                        primary={`Chapter ${index + 1}`} 
                        secondary={chapter.fee !== null ? `Fee: $${chapter.fee.toFixed(2)}` : 'Free'}
                        className="text-gray-700"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>

            <DialogActions className="p-4 border-t border-gray-200 bg-blue-50">
              <Button 
                onClick={readBook}
                variant="contained" 
                color="primary"
                className="w-full py-2 text-white transition-all duration-300 hover:shadow-lg"
              >
                Read Now
              </Button>
            </DialogActions>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default BookBackModal;