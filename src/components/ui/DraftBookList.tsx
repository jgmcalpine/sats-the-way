"use client";

import React, { useEffect, useState } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Grid, Box, Typography, CircularProgress } from "@mui/material";
import { NostrDraftEvent, BookDraft, BookDraftWithMetadata } from "@/types/drafts";
import { useDrafts } from "@/hooks/useDrafts";
import BookFrontCover from "@/components/ui/BookFrontCover";
import BookBackCover from "@/components/ui/BookDraftBackCover";

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
				// const events = await listDrafts();
				// const bookDrafts = events.filter(({ draft }) => isBookDraft(draft));
				// setDrafts(bookDrafts as BookDraftWithMetadata[]);
				setDrafts([{event: {} as NDKEvent, draft: { title: "Grapes of Wrath", author: "John Steinbeck", id: '123' } as BookDraft }])
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
					return <BookFrontCover key={draft.id} book={draft} handleSelectBook={() => handleSelectDraft(bookWithMetadata)} />;
				})}
			 </Grid>
			{/* Detail view section */}
			{selectedBook && (
				<BookBackCover bookWithEvent={selectedBook} handleCloseBook={() => setSelectedBook(null)} handleEditDraft={handleEditDraft} handleDeleteDraft={handleDeleteDraft} />
			)}
		</Box>
	);
};

export default DraftBookList;
