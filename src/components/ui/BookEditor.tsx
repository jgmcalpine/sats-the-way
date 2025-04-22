import React, { useState, useEffect } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
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
	onPublishBook: () => void;
	bookEventId: string;
}

const BookEditor: React.FC<BookEditorProps> = ({ bookEventId, onCreateBook, onPublishBook }) => {
	const [chapters, setChapters] = useState<{ event: NDKEvent, draft: ChapterDraft }[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [isCreatingNewBook, setIsCreatingNewBook] = useState<boolean>(false);
	const [selectedChapterPosition, setSelectedChapterPosition] = useState<number>(0);
	const [draftText, setDraftText] = useState<string>(chapters[selectedChapterPosition]?.draft.body || '');
	const [bookToEdit, setBookToEdit] = useState<{ event: NDKEvent, draft: NostrDraftEvent } | null>(null);
	const { getDraftById, createNewChapter, updateDraft, getChaptersByBookId } = useDrafts();
	console.log("chapters: ", chapters);
	console.log("bookToEdit: ", bookToEdit);
	console.log("draftText: ", draftText);
	// Pending chapter switch is used on desktop when a chapter is clicked.
	const [pendingChapter, setPendingChapter] = useState<ChapterDraft | null>(null);
	useEffect(() => {
		const getDraft = async () => {
			try {
				if (!bookEventId) return;
				const draftBook = await getDraftById(bookEventId);
				console.log("DRAFT BOOK: ", draftBook);
				setBookToEdit(draftBook);
			} catch (e) {
				console.error("Failed to load book", e);
			}
		}

		getDraft();
	}, [bookEventId]);

	useEffect(() => {
		const getChapters = async () => {
			try {
				if (!bookToEdit || !bookToEdit.draft) return;

				setLoading(true);
				const chapters = await getChaptersByBookId(bookToEdit.draft.id, true);
				console.log("chapter: ", chapters);
				const ourChapters = chapters.map(chapter => ({ event: chapter.event, draft: chapter.draft as ChapterDraft }));
				setChapters(ourChapters);
				setLoading(false);
				setSelectedChapterPosition(0);
				setDraftText(ourChapters[0]?.draft.body || '')
			} catch (e) {
				console.error("Failed to load book", e);
			}
		}

		getChapters();
	}, [bookToEdit]);

	const saveDraftForChapter = (chapterPosition: number, text: string): void => {
		console.log(`Saving draft for chapter ${chapterPosition}:`, text);
		const chapterObj = chapters[chapterPosition];
		updateDraft(chapterObj.event, { ...chapterObj.draft, body: text })
	};

	const handleAddChapter = async () => {
		if (!bookToEdit || !bookToEdit.draft) {
		  console.error('No book selected');
		  return;
		}
	  
		try {
		  // Create new chapter data
		  const chapterId = crypto.randomUUID();
		  const newChapterData: Omit<ChapterDraft, 'last_modified' | 'created_at'> = {
			id: chapterId,
			draft_type: 'chapter',
			entry_type: 'chapter',
			media_type: 'text',
			body: 'The story continues...',
			paid: false,
			position: chapters.length, // Position it based on current length
			title: `Chapter ${chapters.length + 1}: The Adventure Continues`,
			book: bookToEdit.draft.id || ''
		  };
	  
		  // Add chapter to the book - use the correct parameter order
		  const { bookEvent, chapterEvent } = await createNewChapter(
			bookEventId,
			newChapterData
		  );
		  
		  console.log('Updated book:', bookEvent.id);
		  console.log('Added chapter:', chapterEvent.id);
		  
		  // Reload chapters to refresh the list - make sure to use the correct ID
		  const updatedChapters = await getChaptersByBookId(bookToEdit.draft.id);
		  setChapters(updatedChapters);
		  
		  // Select the newly added chapter
		  setSelectedChapterPosition(updatedChapters.length - 1);
		  setDraftText(updatedChapters[updatedChapters.length - 1]?.draft.body || '');
		  
		  return { bookEvent, chapterEvent };
		} catch (error) {
		  console.error('Error adding chapter:', error);
		}
	};

	// const loadChapters = async (bookId: string) => {
	// 	try {
	// 	  setLoading(true);
	// 	  const bookChapters = await getChaptersByBookId(bookId);
	// 	  setChapters(bookChapters);
	// 	  setLoading(false);
	// 	  console.log(`Loaded ${bookChapters.length} chapters for book ${bookId}`);
		  
	// 	  // If chapters were loaded successfully, select the first one
	// 	  if (bookChapters.length > 0) {
	// 		setSelectedChapterPosition(0);
	// 		setDraftText(bookChapters[0]?.draft.body || '');
	// 	  }
	// 	} catch (error) {
	// 	  setLoading(false);
	// 	  console.error('Error loading chapters:', error);
	// 	}
	// };

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
		handleAddChapter();
	};

	// If no bookEventId is provided, render a basic view.
	if ((!bookEventId || !bookToEdit) && !isCreatingNewBook) {
		return (
			<Box className="p-4 text-center">
				<Typography variant="h6">No Book Selected</Typography>
				<Button variant="contained" color="primary" onClick={() => setIsCreatingNewBook(true)}>
					Create New Book
				</Button>
			</Box>
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
						  <MenuItem key={chapter.draft.position} value={chapter.draft.position.toString()}>
							Chapter {chapter.draft.position + 1}
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
							key={chapter.draft.position}
							selected={chapter.draft.position === selectedChapterPosition}
							onClick={() => handleChapterClick(chapter.draft as ChapterDraft)}
							sx={{
							  '&.Mui-selected': {
								backgroundColor: 'primary.light',
							  }
							}}
						  >
							<ListItemText primary={`Chapter ${chapter.draft.position}`} />
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
					onClick={() => saveDraftForChapter(selectedChapterPosition, draftText)}
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
		  <Box className="flex justify-end">
			<Button variant="contained" color="primary" onClick={() => onPublishBook()}>
				Publish Book
			</Button> 
		  </Box>
		</Box>
	  );
};

export default BookEditor;
