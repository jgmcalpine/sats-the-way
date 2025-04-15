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
	bookEventId: string | null;
}

const BookEditor: React.FC<BookEditorProps> = ({ bookEventId, onCreateBook }) => {
	console.log("bookEventId: ", bookEventId);
	const [chapters, setChapters] = useState<ChapterDraft[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [isCreatingNewBook, setIsCreatingNewBook] = useState<boolean>(false);
	const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
	const [draftText, setDraftText] = useState<string>('');
	const [bookToEdit, setBookToEdit] = useState<{event: NDKEvent, draft: NostrDraftEvent} | null>(null);
	const { getDraftById } = useDrafts();
	console.log("WJHAT IS BOOJK TO EDIT: ", bookToEdit);
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
	}, [bookEventId])

	// ------ Placeholder Functionality (to be replaced with your real implementation) ------
	const fetchChapters = async (bookId: string): Promise<ChapterDraft[]> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const mockChapters: ChapterDraft[] = Math.random() > 0.5
					? [
							{
								id: '987',
								draft_type: 'chapter',
								entry_type: 'chapter',
								media_type: 'text',
								body: 'Chapter 1 draft content...',
								encrypted_body: null,
								encryption_scheme: null,
								book: bookId,
								paid: false,
								position: 1,
								last_modified: Date.now(),
							},
							{
								id: '3737',
								draft_type: 'chapter',
								entry_type: 'chapter',
								media_type: 'text',
								body: 'Chapter 2 draft content...',
								encrypted_body: null,
								encryption_scheme: null,
								book: bookId,
								paid: false,
								position: 2,
								last_modified: Date.now(),
							},
					  ]
					: [];
				resolve(mockChapters);
			}, 1000);
		});
	};

	const saveDraftForChapter = (chapterId: number, text: string): void => {
		console.log(`Saving draft for chapter ${chapterId}:`, text);
	};

	const createNewChapter = (): void => {
		const newChapter: ChapterDraft = {
			id: 'set new id',
			draft_type: 'chapter',
			entry_type: 'chapter',
			media_type: 'text',
			position: chapters.length + 1,
			book: bookEventId ?? null,
			paid: false,
			body: '',
			encrypted_body: null,
			encryption_scheme: null,
			last_modified: Date.now(),
		};
		setChapters((prev) => [...prev, newChapter]);
		setSelectedChapterId(newChapter.position);
		setDraftText('');
	};
	// ------------------------------------------------------------------------------------

	useEffect(() => {
		const loadChapters = async () => {
			if (!bookEventId) return;
			setLoading(true);
			const fetchedChapters = await fetchChapters(bookEventId);
			if (fetchedChapters.length === 0) {
				const defaultChapter: ChapterDraft = {
					id: '123',
					draft_type: 'chapter',
					entry_type: 'chapter',
					media_type: 'text',
					position: 1,
					book: bookEventId,
					paid: false,
					body: '',
					encrypted_body: null,
					encryption_scheme: null,
					last_modified: Date.now(),
				};
				setChapters([defaultChapter]);
				setSelectedChapterId(1);
			} else {
				setChapters(fetchedChapters);
				setSelectedChapterId(fetchedChapters[0].position);
			}
			setLoading(false);
		};
		loadChapters();
	}, [bookEventId]);

	// ------- Desktop Modal Handlers -------
	const handleChapterClick = (chapter: ChapterDraft) => {
		// Only open the modal if it's a different chapter.
		if (chapter.position !== selectedChapterId) {
			setPendingChapter(chapter);
		}
	};

	const confirmChapterSwitch = () => {
		// Save the current draft before switching.
		saveDraftForChapter(selectedChapterId, draftText);
		if (pendingChapter) {
			setSelectedChapterId(pendingChapter.position);
			setDraftText(pendingChapter.body || '');
		}
		setPendingChapter(null);
	};

	const cancelChapterSwitch = () => {
		setPendingChapter(null);
	};
	// Handler for mobile selection change.
	const handleMobileSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedChapterId(parseInt(event.target.value, 10));
	};

	const handleNextChapter = () => {
		saveDraftForChapter(selectedChapterId, draftText);
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
						value={selectedChapterId.toString()}
						onChange={() => handleMobileSelectChange}
						variant="outlined"
						fullWidth
						size="small"
					  >
						{chapters.map((chapter) => (
						  <MenuItem key={chapter.position} value={chapter.position.toString()}>
							Chapter {chapter.position}
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
							selected={chapter.position === selectedChapterId}
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
