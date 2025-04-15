"use client";

import React, { useEffect, useState } from "react";
import { Grid, Box, Card, CardContent, Typography, CircularProgress, Button, Divider, Chip } from "@mui/material";
import { NostrDraftEvent, BookDraft, BookDraftWithMetadata } from "@/types/drafts";
import { useDrafts } from "@/hooks/useDrafts";

// Type guard: checks if the draft is a BookDraft (and not a ChapterDraft)
function isBookDraft(draft: NostrDraftEvent): draft is BookDraft {
	return draft.draft_type === "book";
}

const mockDrafts: BookDraftWithMetadata[] = [
	{
		title: "The Lightning Library",
		slug: "lightning-library",
		language: "en",
		draft: {
			id: '1234',
			draft_type: "book",
			published: false,
			last_modified: Date.now() - 1000 * 60 * 10, // 10 minutes ago
			series_type: "book",
			media_type: "text",
			title: "The Lightning Library",
			slug: "lightning-library",
			author: "satoshi",
			description: "A story about energy, freedom, and zaps.",
			language: "en",
			tags: ["nostr", "bitcoin"],
			chapters: [
				{ id: "ch1", title: "Chapter 1: Spark", paid: false, position: 1 },
				{ id: "ch2", title: "Chapter 2: Thunder", paid: true, position: 2 }
			]
		}
	},
	{
		title: "Zap Saga",
		slug: "zap-saga",
		language: "en",
		draft: {
			id: '456',
			draft_type: "book",
			published: false,
			last_modified: Date.now() - 1000 * 60 * 30, // 30 minutes ago
			series_type: "book",
			media_type: "text",
			title: "Zap Saga",
			slug: "zap-saga",
			author: "anon",
			description: "An epic journey powered by zaps.",
			language: "en",
			tags: ["fiction", "lightning"],
			chapters: [
				{ id: "ch1", title: "Chapter 1: The Beginning", paid: false, position: 1 }
			]
		}
	}
];

interface DraftBookListProps {
	handleEditDraft: (draft: BookDraftWithMetadata) => void;
}

const DraftBookList: React.FC<DraftBookListProps> = ({ handleEditDraft }: DraftBookListProps) => {
	const [drafts, setDrafts] = useState<BookDraftWithMetadata[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedDraft, setSelectedDraft] = useState<BookDraftWithMetadata | null>(null);
    const { listDrafts } = useDrafts();

    useEffect(() => {
		const loadDrafts = async () => {
			try {
				const events = await listDrafts();
                console.log("EVENT: ", events);
				const bookDrafts = events
					.filter(({ draft }) => isBookDraft(draft))
					.map(({ draft }) => ({
						title: draft.title || '',
						draft: draft as BookDraft,
					}));
				setDrafts(bookDrafts);
			} catch (e) {
				console.error("Failed to load drafts", e);
			} finally {
				setLoading(false);
			}
		};

		loadDrafts();
	}, []);

	// Handler to select a draft for viewing its details
	const handleSelectDraft = (draft: BookDraftWithMetadata) => {
		setSelectedDraft(draft);
	};

	const renderCard = (book: BookDraftWithMetadata) => (
		<Grid size={{xs: 12, sm: 6, md: 4}} key={book.slug}>
			<Card variant="outlined" onClick={() => handleSelectDraft(book)} sx={{ cursor: "pointer", "&:hover": { boxShadow: 3 } }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{book.title}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Slug: {book.slug}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Language: {book.language}
					</Typography>
					<Box mt={1}>
						<Chip label="Draft" color="warning" size="small" />
					</Box>
				</CardContent>
			</Card>
		</Grid>
	);

	return (
		<Box p={2}>
			<Typography variant="h5" gutterBottom>
				Your Draft Books
			</Typography>
			{loading ? (
				<CircularProgress />
			) : (
				<Grid container spacing={2}>
					{(drafts.length ? drafts : mockDrafts).map(renderCard)}
				</Grid>
			)}
			{/* Detail view section */}
			{selectedDraft && (
				<Box mt={4} p={2} border="1px solid #ddd" borderRadius={2}>
					<Typography variant="h6" gutterBottom>
						Details for: {selectedDraft.title}
					</Typography>
					<Divider sx={{ mb: 2 }} />
					<Typography variant="body1">
						Description: {selectedDraft.draft.description || "No description provided."}
					</Typography>
					<Typography variant="body1">
						Last Updated:{" "}
						{new Date(selectedDraft.draft.last_modified).toLocaleString(undefined, {
							hour: "2-digit",
							minute: "2-digit",
							year: "numeric",
							month: "short",
							day: "numeric"
						})}
					</Typography>
					{selectedDraft.draft.chapters && (
						<Typography variant="body1">
							Number of Chapters: {selectedDraft.draft.chapters.length}
						</Typography>
					)}
					<Box mt={2} display="flex" gap={2}>
						<Button variant="contained" color="primary" onClick={() => handleEditDraft(selectedDraft)}>
							Edit Draft
						</Button>
						<Button variant="outlined" onClick={() => setSelectedDraft(null)}>
							Close Details
						</Button>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default DraftBookList;
