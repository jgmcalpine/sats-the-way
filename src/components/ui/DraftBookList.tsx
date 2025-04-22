"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { BookDraftWithMetadata } from "@/types/drafts";
import Bookshelf, { BookData } from "@/components/ui/BookShelf";
import { mockBooks } from "@/constants/mock";

interface DraftBookListProps {
	handleEditDraft: (draft: BookData | undefined) => void;
	handleDeleteDraft?: (draft: BookDraftWithMetadata) => void;
}

const DraftBookList: React.FC<DraftBookListProps> = ({ handleEditDraft }: DraftBookListProps) => {
	const [drafts, setDrafts] = useState<BookData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
		const loadDrafts = async () => {
			try {
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
				onChooseBook={(id: string) => {
					const draftToEdit = drafts.find((draft) => draft.id === id)
					handleEditDraft(draftToEdit);
				}}
				books={drafts} 
			/>
		</Box>
	);
};

export default DraftBookList;
