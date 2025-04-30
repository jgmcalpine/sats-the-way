import React, { useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Container,
  Card,
  CardContent,
  Grid 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { State, Transition } from '@/hooks/useFsm';

export interface BookMetadata {
  title: string;
  authorPubkey?: string;
  coverImage?: string;
  description?: string;
  genre?: string;
  publishDate?: string;
}

// Props interface for the component
export interface NostrBookReaderProps {
  currentChapter: State;
  bookMetadata: BookMetadata;
  onTransitionSelect: (transition: Transition) => void;
  onPreviousChapter?: () => void;
  hasPreviousChapter?: boolean;
}

// Styled components for the book pages
const BookContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(4, 'auto'),
  height: '80vh',
  maxHeight: '800px',
  backgroundColor: theme.palette.background.default,
}));

const BookPage = styled(Paper)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px 0 0 4px',
  backgroundColor: theme.palette.background.paper,
}));

const LeftPage = styled(BookPage)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.grey[50],
}));

const RightPage = styled(BookPage)(({ theme }) => ({
  borderLeft: 'none',
  borderRadius: '0 4px 4px 0',
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const ChapterContent = styled(Box)(({ theme }) => ({
  overflow: 'auto',
  marginBottom: theme.spacing(2),
  flexGrow: 1,
  fontSize: '1.1rem',
  lineHeight: '1.6',
}));

const ChoiceButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  textAlign: 'left',
  justifyContent: 'flex-start',
  textTransform: 'none',
  display: 'block',
  width: '100%',
}));

/**
 * NostrBookReader Component
 * 
 * A component that displays an interactive book with chapters and choices
 * that allow navigation between different states (chapters).
 */
const NostrBookReader: React.FC<NostrBookReaderProps> = ({
  currentChapter,
  bookMetadata,
  onTransitionSelect,
  onPreviousChapter,
  hasPreviousChapter = false,
}) => {
  const handleTransitionClick = useCallback((transition: Transition) => {
    onTransitionSelect(transition);
  }, [onTransitionSelect]);

  return (
    <BookContainer>
      <Grid container spacing={0} sx={{ height: '100%', width: '100%', boxShadow: 4 }}>
        {/* Left Page - Book Metadata and Chapter Info */}
        <Grid size={{xs: 12, md: 4}}>
          <LeftPage elevation={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {bookMetadata.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                by {bookMetadata.authorPubkey}
              </Typography>
              
              {bookMetadata.description && (
                <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                  {bookMetadata.description}
                </Typography>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h5" sx={{ mb: 2 }}>
                {currentChapter.name}
              </Typography>
              
              {bookMetadata.genre && (
                <Typography variant="body2" color="text.secondary">
                  Genre: {bookMetadata.genre}
                </Typography>
              )}
              
              {Boolean(currentChapter.entryFee) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Entry Fee: {currentChapter.entryFee}
                </Typography>
              )}
            </Box>
            
            {/* Previous Chapter Button */}
            {hasPreviousChapter && onPreviousChapter && (
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={onPreviousChapter}
                sx={{ mt: 2, alignSelf: 'flex-start' }}
              >
                Previous Chapter
              </Button>
            )}
          </LeftPage>
        </Grid>
        
        {/* Right Page - Chapter Content and Choices */}
        <Grid size={{xs: 12, md: 8}}>
          <RightPage elevation={3}>
            <ChapterContent>
              <Typography variant="body1" component="div">
                {currentChapter.content}
              </Typography>
            </ChapterContent>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Choices for Next Chapter */}
            <Box>
              {currentChapter.isEndState ? (
                <Card variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      The End
                    </Typography>
                    <Typography variant="body2">
                      You&apos;ve reached the end of this story.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    What will you do next?
                  </Typography>
                  {currentChapter.transitions.map((transition) => (
                    <ChoiceButton
                      key={transition.id}
                      variant="outlined"
                      onClick={() => handleTransitionClick(transition)}
                      endIcon={<ArrowForwardIcon />}
                    >
                      <Typography variant="body1">
                        {transition.choiceText}
                        {Boolean(transition.price) && (
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({transition.price} sats)
                          </Typography>
                        )}
                      </Typography>
                    </ChoiceButton>
                  ))}
                </>
              )}
            </Box>
          </RightPage>
        </Grid>
      </Grid>
    </BookContainer>
  );
};

export default NostrBookReader;