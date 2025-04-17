import { Box, Grid, Card, CardContent, Typography } from "@mui/material"
import { BookDraft } from '@/types/drafts';

interface BookCoverProps {
    book: BookDraft;
    handleSelectBook: (book: BookDraft) => void;
}

export default function BookCover({ book, handleSelectBook }: BookCoverProps) {
    const { title, description, id, author } = book;
    return (
        <Grid size={{xs: 12, sm: 6, md: 4}} key={id} className="min-w-[75px] min-h-[140px]">
            <Card variant="outlined" onClick={() => handleSelectBook(book)} sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }} className="h-full">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    {author && (
                        <Typography variant="body2" color="text.secondary">
                            { `By ${author}` }
                        </Typography>
                    )}
                    {description && (
                        <Typography variant="body2" color="text.secondary">
                            { description }
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Grid>
    )
}