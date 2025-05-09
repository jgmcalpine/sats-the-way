import React from 'react';
import {
    Box,
    Button,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    AutoStories,
    CheckCircleOutline,
} from '@mui/icons-material';

// --- Props Interface ---
interface AdventureHeaderProps {
    onStartWriting: () => void;
}

// --- The Component ---
const AdventureHeader: React.FC<AdventureHeaderProps> = ({
    onStartWriting
}) => {
    return (
        <Box className="bg-white py-16 md:py-24 px-6 shadow-sm border border-gray-100 overflow-hidden relative">

            <Grid container spacing={6} alignItems="center" className="relative z-10">

                {/* Left Column: Headline, Sub-headline, CTA */}
                <Grid size={{xs: 12, md: 6}} className="flex flex-col justify-center text-center md:text-left">
                    <AutoStories sx={{ fontSize: 40 }} className="text-indigo-500 mb-3 mx-auto md:mx-0" />

                    <Typography
                        variant="h2" // Larger heading for impact
                        component="h1"
                        className="font-bold font-serif tracking-tight text-gray-800 mb-4 text-4xl sm:text-5xl leading-tight"
                    >
                        Unleash Your Story.
                    </Typography>

                    <Typography
                        variant="h6" // Use h6 for semantic structure but style like body text
                        component="p"
                        className="text-lg text-gray-600 mb-8 font-sans font-light max-w-lg mx-auto md:mx-0" // Limit width for readability
                    >
                        Craft interactive adventures where choices truly matter. Build branching narratives, design unique paths, and share your world with readers.
                    </Typography>

                    <Box className="mt-2 flex justify-center md:justify-start"> {/* Button container */}
                        <Button
                            variant="contained"
                            size="large"
                            // Use a different icon, maybe related to creation/writing
                            startIcon={<AutoStories />} // Or EditNote, Create
                            onClick={onStartWriting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-medium normal-case px-8 py-3 rounded-md shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
                            // Optional: Add subtle animation on hover if desired
                            // sx={{ '&:hover .MuiButton-endIcon': { transform: 'translateX(3px)', transition: 'transform 0.2s ease-in-out' } }}
                            // endIcon={<ArrowForward sx={{ transition: 'transform 0.2s ease-in-out' }} />}
                        >
                            Start Your Adventure
                        </Button>
                    </Box>
                </Grid>

                {/* Right Column: How It Works */}
                <Grid size={{xs: 12, md: 6}}>
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
                                    <CheckCircleOutline fontSize="small" className="text-indigo-500" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Add 'Steps' to create chapters."
                                    primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                                />
                            </ListItem>
                            <ListItem className="py-1 px-0">
                                <ListItemIcon className="min-w-0 mr-3">
                                    <CheckCircleOutline fontSize="small" className="text-indigo-500" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Write content and design 'Choices' for forks."
                                    primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                                />
                            </ListItem>
                            <ListItem className="py-1 px-0">
                                <ListItemIcon className="min-w-0 mr-3">
                                    <CheckCircleOutline fontSize="small" className="text-indigo-500" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Link choices to target steps, building the flow."
                                    primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                                />
                            </ListItem>
                            <ListItem className="py-1 px-0">
                                <ListItemIcon className="min-w-0 mr-3">
                                    <CheckCircleOutline fontSize="small" className="text-indigo-500" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Optionally set entry fees or choice prices."
                                    primaryTypographyProps={{ variant: 'body1', className: 'text-gray-700' }}
                                />
                            </ListItem>
                            <ListItem className="py-1 px-0">
                                <ListItemIcon className="min-w-0 mr-3">
                                    <CheckCircleOutline fontSize="small" className="text-indigo-500" />
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
        </Box>
    );
};

export default AdventureHeader;