"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { NostrDraftEvent, BookDraft, BookDraftWithMetadata } from "@/types/drafts";
import { useDrafts } from "@/hooks/useDrafts";
import Bookshelf, { BookData } from "@/components/ui/BookShelf";
import { mockBooks } from "@/constants/mock";

// Type guard: checks if the draft is a BookDraft (and not a ChapterDraft)
function isBookDraft(draft: NostrDraftEvent): draft is BookDraft {
	return draft.draft_type === "book";
}

interface DraftBookListProps {
	handleEditDraft: (draft: BookDraftWithMetadata) => void;
	handleDeleteDraft: (draft: BookDraftWithMetadata) => void;
}

const DraftBookList: React.FC<DraftBookListProps> = ({ handleEditDraft, handleDeleteDraft }: DraftBookListProps) => {
	const [drafts, setDrafts] = useState<BookData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
    // const { listDrafts } = useDrafts();
    useEffect(() => {
		const loadDrafts = async () => {
			try {
				// const events = await listDrafts();
				// const bookDrafts = events.filter(({ draft }) => isBookDraft(draft));
				// setDrafts(bookDrafts as BookDraftWithMetadata[]);
				setDrafts(mockBooks)
			} catch (e) {
				console.error("Failed to load drafts", e);
			} finally {
				setIsLoading(false);
			}
		};

		loadDrafts();
	}, []);

	if (isLoading) {
		return <CircularProgress />;
	}

	return (
		<Box p={2} className="min-w-full flex flex-col items-center">
			<Typography variant="h5" gutterBottom>
				Your Draft Books
			</Typography>
			<Bookshelf 
				books={drafts} 
			/>
		</Box>
	);
};

export default DraftBookList;
