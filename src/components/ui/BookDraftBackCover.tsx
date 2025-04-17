import {Box, Typography, IconButton, Divider, Button} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

import { BookDraftWithMetadata } from '@/types/drafts';

interface BookBackCoverProps {
    bookWithEvent: BookDraftWithMetadata;
    handleCloseBook: () => void;
    handleEditDraft: (book: BookDraftWithMetadata) => void;
    handleDeleteDraft: (book: BookDraftWithMetadata) => void;
}

export default function BookBackCover({ bookWithEvent, handleCloseBook, handleEditDraft, handleDeleteDraft }: BookBackCoverProps) {
    const { draft } = bookWithEvent;
    const { title, description, chapters } = draft;

    return (
        <Box mt={4} p={2} border="1px solid #ddd" borderRadius={2}>
            <Box className="flex justify-between">
                <Typography variant="h6" gutterBottom>
                    Details for: { title }
                </Typography>
                <IconButton className="text-white" onClick={() => handleCloseBook()}>
                    <CloseIcon color="primary" />
                </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
                Description: { description || "No description provided." }
            </Typography>
            {chapters && (
                <Typography variant="body1">
                    Number of Chapters: {chapters.length}
                </Typography>
            )}
            <Box mt={2} display="flex" gap={2}>
                <Button variant="contained" color="primary" onClick={() => handleEditDraft(bookWithEvent)}>
                    Edit Draft
                </Button>
                <Button variant="outlined" onClick={() => handleDeleteDraft(bookWithEvent)}>
                    Delete Draft
                </Button>
            </Box>
        </Box>
    )
}