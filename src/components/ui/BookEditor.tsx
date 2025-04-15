import React, { useState, useEffect } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { v4 as uuidv4 } from 'uuid';
import { 
	TextField, 
	Button, 
	Select, 
	MenuItem, 
	CircularProgress,
	Paper,
	Box,
	Typography,
	Divider,
	List,
	ListItem,
	ListItemButton,
	ListItemText
  } from '@mui/material';
import ChapterSwitchModal from '@/components/ui/ChapterSwitchModal';
import NewBookModal from '@/components/ui/NewBookModal';
import type { ChapterDraft, NostrDraftEvent } from '@/types/drafts';
import { CreateBookMetadata } from '@/types/books';
import { useDrafts } from '@/hooks/useDrafts';

interface BookEditorProps {
    onCreateBook: (book: CreateBookMetadata) => void;
	bookEventId: string;
}

const BookEditor: React.FC<BookEditorProps> = ({ bookEventId, onCreateBook }) => {
	const [chapters, setChapters] = useState<ChapterDraft[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [isCreatingNewBook, setIsCreatingNewBook] = useState<boolean>(false);
	const [selectedChapterPosition, setSelectedChapterPosition] = useState<number>(0);
	const [draftText, setDraftText] = useState<string>('');
	const [bookToEdit, setBookToEdit] = useState<{ event: NDKEvent, draft: NostrDraftEvent } | null>(null);
	const { getDraftById, listDrafts, createDraft } = useDrafts();
	// Pending chapter switch is used on desktop when a chapter is clicked.
	const [pendingChapter, setPendingChapter] = useState<ChapterDraft | null>(null);
	useEffect(() => {
		const getDraft = async () => {
			try {
				if (!bookEventId) return;
				const draftBook = await getDraftById(bookEventId);
				setBookToEdit(draftBook);
			} catch (e) {
				console.error("Failed to load book");
			}
		}

		getDraft();
	}, [bookEventId]);

	useEffect(() => {
		const getChapters = async () => {
			try {
				if (!bookEventId) return;

				setLoading(true);
				const chapters = await listDrafts({ book: bookEventId, draft_type: "chapter" });

				setChapters(chapters.map(chapter => chapter.draft as ChapterDraft));
				setLoading(false);
				setSelectedChapterPosition(0);
			} catch (e) {
				console.error("Failed to load book");
			}
		}

		getChapters();
	}, [bookEventId]);

	const saveDraftForChapter = (chapterId: number, text: string): void => {
		console.log(`Saving draft for chapter ${chapterId}:`, text);
	};

	const createNewChapter = async (): Promise<void> => {
		const newChapter = {
			id: uuidv4(),
			draft_type: "chapter" as const,
			media_type: "text" as const,
			entry_type: "chapter" as const,
			body: "",
			paid: false,
			last_modified: new Date().getTime(),
			book: bookEventId,
			position: chapters.length
		}
		await createDraft(newChapter);

		setChapters((prev) => [...prev, newChapter]);
		setSelectedChapterPosition(selectedChapterPosition + 1);
		setDraftText('');
	};

	// ------- Desktop Modal Handlers -------
	const handleChapterClick = (chapter: ChapterDraft) => {
		// Only open the modal if it's a different chapter.
		if (chapter.position !== selectedChapterPosition) {
			setPendingChapter(chapter);
		}
	};

	const confirmChapterSwitch = () => {
		// Save the current draft before switching.
		saveDraftForChapter(selectedChapterPosition, draftText);
		if (pendingChapter) {
			setSelectedChapterPosition(pendingChapter.position);
			setDraftText(pendingChapter.body || '');
		}
		setPendingChapter(null);
	};

	const cancelChapterSwitch = () => {
		setPendingChapter(null);
	};
	// Handler for mobile selection change.
	const handleMobileSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedChapterPosition(parseInt(event.target.value, 10));
	};

	const handleNextChapter = () => {
		saveDraftForChapter(selectedChapterPosition, draftText);
		createNewChapter();
	};

	// If no bookEventId is provided, render a basic view.
	if ((!bookEventId || !bookToEdit) && !isCreatingNewBook) {
		return (
			<div className="p-4 text-center">
				<Typography variant="h6">No Book Selected</Typography>
				<Button variant="contained" color="primary" onClick={() => setIsCreatingNewBook(true)}>
					Create New Book
				</Button>
			</div>
		);
	}

	const { title } = bookToEdit?.draft || {};

	return (
		<Box className="p-4 w-full">
		  <Paper elevation={3} className="p-4">
			<Box className="flex flex-col lg:flex-row gap-4">
			  {/* Chapter List - Responsive for all devices */}
			  <Box className="w-full lg:w-48 mb-4 lg:mb-0">
				{loading ? (
				  <Box className="flex justify-center p-4">
					<CircularProgress size={24} />
				  </Box>
				) : (
				  <>
					{/* Show dropdown on small screens */}
					<Box className="block lg:hidden mb-4">
					  <Select
						value={selectedChapterPosition.toString()}
						onChange={() => handleMobileSelectChange}
						variant="outlined"
						fullWidth
						size="small"
					  >
						{chapters.map((chapter) => (
						  <MenuItem key={chapter.position} value={chapter.position.toString()}>
							Chapter {chapter.position + 1}
						  </MenuItem>
						))}
					  </Select>
					</Box>
					
					{/* Show list on larger screens */}
					<Paper variant="outlined" className="hidden lg:block h-full max-h-80 overflow-y-auto">
					  <List disablePadding>
						<ListItem sx={{ backgroundColor: '#f5f5f5' }}>
						  {title && (
							<Typography variant="subtitle2" fontWeight="bold">
								{title}
						  	</Typography>
						)}
						</ListItem>
						<Divider />
						{chapters.map((chapter) => (
						  <ListItemButton
							key={chapter.position}
							selected={chapter.position === selectedChapterPosition}
							onClick={() => handleChapterClick(chapter)}
							sx={{
							  '&.Mui-selected': {
								backgroundColor: 'primary.light',
							  }
							}}
						  >
							<ListItemText primary={`Chapter ${chapter.position}`} />
						  </ListItemButton>
						))}
					  </List>
					</Paper>
				  </>
				)}
			  </Box>
	  
			  {/* Editor - Responsive for all devices */}
			  <Box className="flex-grow">
				<TextField
				  label="Chapter Content"
				  variant="outlined"
				  multiline
				  minRows={4}
				  maxRows={12}
				  fullWidth
				  value={draftText}
				  onChange={(e) => setDraftText(e.target.value)}
				  className="bg-white mb-4"
				/>
				
				{/* Action Buttons */}
				<Box className="flex justify-end gap-2">
				  <Button 
					variant="outlined" 
					color="primary"
					onClick={() => saveDraftForChapter}
				  >
					Save
				  </Button>
				  <Button 
					variant="contained" 
					color="primary" 
					onClick={handleNextChapter}
				  >
					Next
				  </Button>
				</Box>
			  </Box>
			</Box>
		  </Paper>
		  
		  {/* Modals */}
		  <ChapterSwitchModal
			open={pendingChapter !== null}
			onConfirm={confirmChapterSwitch}
			onCancel={cancelChapterSwitch}
		  />
		  <NewBookModal 
			open={isCreatingNewBook} 
			onClose={() => setIsCreatingNewBook(false)} 
			onSubmit={onCreateBook} 
		  />
		</Box>
	  );
};

export default BookEditor;
