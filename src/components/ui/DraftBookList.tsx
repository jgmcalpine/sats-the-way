"use client";

import React, { useEffect, useState } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Grid, Box, Typography, CircularProgress, Button, Divider, IconButton } from "@mui/material";
import { Close as CloseIcon } from '@mui/icons-material';

import { NostrDraftEvent, BookDraft, BookDraftWithMetadata } from "@/types/drafts";
import { useDrafts } from "@/hooks/useDrafts";
import BookCover from "@/components/ui/BookCover";

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
	const [isLoading, setIsLoading] = useState(true);
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
				setIsLoading(false);
			}
		};

		loadDrafts();
	}, []);

	// Handler to select a draft for viewing its details
	const handleSelectDraft = (event: BookDraftWithMetadata) => {
		setSelectedBook(event);
	};

	if (isLoading) {
		return <CircularProgress />;
	}

	return (
		<Box p={2} className="min-w-full flex flex-col items-center">
			<Typography variant="h5" gutterBottom>
				Your Draft Books
			</Typography>
			<Grid container spacing={2} width="50%">
				{drafts.length && drafts.map((bookWithMetadata) => {
					const { draft } = bookWithMetadata;
					console.log("what is draft here")
					return <BookCover key={draft.id} book={draft} handleSelectBook={() => handleSelectDraft(bookWithMetadata)} />;
				})}
			 </Grid>
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
