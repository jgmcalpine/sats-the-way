"use client";

import React, { useEffect, useState } from "react";
import { Grid, Box, Card, CardContent, Typography, CircularProgress, Button, Divider, Chip, IconButton } from "@mui/material";
import { Close as CloseIcon } from '@mui/icons-material';
import { NostrDraftEvent, BookDraft, BookDraftWithMetadata } from "@/types/drafts";
import { useDrafts } from "@/hooks/useDrafts";

// Type guard: checks if the draft is a BookDraft (and not a ChapterDraft)
function isBookDraft(draft: NostrDraftEvent): draft is BookDraft {
	return draft.draft_type === "book";
}

interface DraftBookListProps {
	handleEditDraft: (draft: BookDraftWithMetadata) => void;
	handleDeleteDraft: (draft: BookDraftWithMetadata) => void;
}

const DraftBookList: React.FC<DraftBookListProps> = ({ handleEditDraft, handleDeleteDraft }: DraftBookListProps) => {
	const [drafts, setDrafts] = useState<BookDraftWithMetadata[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedBook, setSelectedBook] = useState<BookDraftWithMetadata | null>(null);
    const { listDrafts } = useDrafts();
    useEffect(() => {
		const loadDrafts = async () => {
			try {
				const events = await listDrafts();
				const bookDrafts = events.filter(({ draft }) => isBookDraft(draft));
				setDrafts(bookDrafts as BookDraftWithMetadata[]);
			} catch (e) {
				console.error("Failed to load drafts", e);
			} finally {
				setLoading(false);
			}
		};

		loadDrafts();
	}, []);

	// Handler to select a draft for viewing its details
	const handleSelectDraft = (event: BookDraftWithMetadata) => {
		setSelectedBook(event);
	};

	const renderCard = (book: BookDraftWithMetadata) => {
		return (
		<Grid size={{xs: 12, sm: 6, md: 4}} key={book.draft.id}>
			<Card variant="outlined" onClick={() => handleSelectDraft(book)} sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{book.draft.title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Language: 'English'
					</Typography>
					<Box mt={1}>
						<Chip label="Draft" color="warning" size="small" />
					</Box>
				</CardContent>
			</Card>
		</Grid>
	)};

	return (
		<Box p={2}>
			<Typography variant="h5" gutterBottom>
				Your Draft Books
			</Typography>
			{loading ? (
				<CircularProgress />
			) : (
				<Grid container spacing={2}>
					{(drafts.length ? drafts : []).map(renderCard)}
				</Grid>
			)}
			{/* Detail view section */}
			{selectedBook && (
				<Box mt={4} p={2} border="1px solid #ddd" borderRadius={2}>
					<Box className="flex justify-between">
						<Typography variant="h6" gutterBottom>
							Details for: {selectedBook.draft.title}
						</Typography>
						<IconButton className="text-white" onClick={() => setSelectedBook(null)}>
							<CloseIcon color="primary" />
						</IconButton>
					</Box>
					<Divider sx={{ mb: 2 }} />
					<Typography variant="body1">
						Description: {selectedBook.draft.description || "No description provided."}
					</Typography>
					<Typography variant="body1">
						Last Updated:{" "}
						{new Date(selectedBook.draft.last_modified).toLocaleString(undefined, {
							hour: "2-digit",
							minute: "2-digit",
							year: "numeric",
							month: "short",
							day: "numeric"
						})}
					</Typography>
					{selectedBook.draft.chapters && (
						<Typography variant="body1">
							Number of Chapters: {selectedBook.draft.chapters.length}
						</Typography>
					)}
					<Box mt={2} display="flex" gap={2}>
						<Button variant="contained" color="primary" onClick={() => handleEditDraft(selectedBook)}>
							Edit Draft
						</Button>
						<Button variant="outlined" onClick={() => handleDeleteDraft(selectedBook)}>
							Delete Draft
						</Button>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default DraftBookList;
