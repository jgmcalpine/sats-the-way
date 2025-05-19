import { AutoStories, CheckCircleOutline } from '@mui/icons-material';
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';

// --- Props Interface ---
interface AdventureHeaderProps {
  onStartWriting: () => void;
}

// --- The Component ---
const AdventureHeader: React.FC<AdventureHeaderProps> = ({ onStartWriting }) => {
  return (
    <Paper
      elevation={2}
      className="bg-white py-16 md:py-24 px-6 shadow-sm border border-gray-100 overflow-hidden relative"
    >
      <Grid container spacing={6} alignItems="center" className="relative z-10">
        {/* Left Column: Headline, Sub-headline, CTA */}
        <Grid
          size={{ xs: 12, md: 6 }}
          gap={1}
          className="flex flex-col justify-center text-center md:text-left"
        >
          <AutoStories sx={{ fontSize: 40 }} className="mb-3 mx-auto md:mx-0" color="secondary" />

          <Typography
            variant="h3"
            component="h1"
            className=" tracking-tight text-gray-800 mb-4 text-4xl sm:text-5xl leading-tight"
          >
            Create your own.
          </Typography>

          <Typography
            variant="h6" // Use h6 for semantic structure but style like body text
            component="p"
            className="text-lg text-gray-600 mb-8 font-sans font-light max-w-lg mx-auto md:mx-0" // Limit width for readability
          >
            Craft interactive stories or educational works where choices truly matter. Build
            branching narratives, design unique paths, and share your world with readers.
          </Typography>

          <Box className="mt-2 flex justify-center md:justify-start">
            {' '}
            {/* Button container */}
            <Button
              variant="contained"
              size="large"
              startIcon={<AutoStories />}
              onClick={onStartWriting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-medium normal-case px-8 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
            >
              Start Your Adventure
            </Button>
          </Box>
        </Grid>

        {/* Right Column: How It Works */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Add some visual separation or just rely on spacing */}
          <Box className="bg-slate-50/60 p-6 md:p-8 rounded-lg border border-slate-200/80">
            <Typography
              variant="h5"
              component="h2"
              className="font-semibold font-sans text-gray-700 mb-5 text-center md:text-left"
            >
              How It Works:
            </Typography>

            <List dense className="font-sans">
              <ListItem className="py-1 px-0">
                <ListItemIcon className="min-w-0 mr-3">
                  <CheckCircleOutline fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Add 'Steps' to create chapters."
                  primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                />
              </ListItem>
              <ListItem className="py-1 px-0">
                <ListItemIcon className="min-w-0 mr-3">
                  <CheckCircleOutline fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Write content and design 'Choices' for forks."
                  primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                />
              </ListItem>
              <ListItem className="py-1 px-0">
                <ListItemIcon className="min-w-0 mr-3">
                  <CheckCircleOutline fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Link choices to target steps."
                  primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                />
              </ListItem>
              <ListItem className="py-1 px-0">
                <ListItemIcon className="min-w-0 mr-3">
                  <CheckCircleOutline fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Optionally set entry fees."
                  primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                />
              </ListItem>
              <ListItem className="py-1 px-0">
                <ListItemIcon className="min-w-0 mr-3">
                  <CheckCircleOutline fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Save progress and publish your finished tale."
                  primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                />
              </ListItem>
            </List>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AdventureHeader;
