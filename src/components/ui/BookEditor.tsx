import React, { useState, useEffect } from 'react';
import {
	Button,
	CircularProgress,
	MenuItem,
	Select,
	TextField,
	Typography,
	SelectChangeEvent
} from '@mui/material';
import ChapterSwitchModal from '@/components/ui/ChapterSwitchModal';
import type { ChapterDraft } from '@/types/drafts'; // Adjust the import path

interface BookEditorProps {
    onCreateBook: () => void;
	bookId: string | null;
}

const BookEditor: React.FC<BookEditorProps> = ({ bookId, onCreateBook }) => {
	// State for chapter drafts, loading, current selected chapter (by position) and draft text.
	const [chapters, setChapters] = useState<ChapterDraft[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
	const [draftText, setDraftText] = useState<string>('');
	// Pending chapter switch is used on desktop when a chapter is clicked.
	const [pendingChapter, setPendingChapter] = useState<ChapterDraft | null>(null);

	// ------ Placeholder Functionality (to be replaced with your real implementation) ------
	const fetchChapters = async (bookId: string): Promise<ChapterDraft[]> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const mockChapters: ChapterDraft[] = Math.random() > 0.5
					? [
							{
								draft_type: 'chapter',
								entry_type: 'chapter',
								media_type: 'text',
								body: 'Chapter 1 draft content...',
								encrypted_body: null,
								encryption_scheme: null,
								book: bookId,
								paid: false,
								position: 1,
								published: false,
								last_modified: Date.now(),
							},
							{
								draft_type: 'chapter',
								entry_type: 'chapter',
								media_type: 'text',
								body: 'Chapter 2 draft content...',
								encrypted_body: null,
								encryption_scheme: null,
								book: bookId,
								paid: false,
								position: 2,
								published: false,
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
			draft_type: 'chapter',
			entry_type: 'chapter',
			media_type: 'text',
			position: chapters.length + 1,
			book: bookId ?? null,
			paid: false,
			body: '',
			encrypted_body: null,
			encryption_scheme: null,
			published: false,
			last_modified: Date.now(),
		};
		setChapters((prev) => [...prev, newChapter]);
		setSelectedChapterId(newChapter.position);
		setDraftText('');
	};
	// ------------------------------------------------------------------------------------

	useEffect(() => {
		const loadChapters = async () => {
			if (!bookId) return;
			setLoading(true);
			const fetchedChapters = await fetchChapters(bookId);
			if (fetchedChapters.length === 0) {
				const defaultChapter: ChapterDraft = {
					draft_type: 'chapter',
					entry_type: 'chapter',
					media_type: 'text',
					position: 1,
					book: bookId,
					paid: false,
					body: '',
					encrypted_body: null,
					encryption_scheme: null,
					published: false,
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
	}, [bookId]);

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
	const handleMobileSelectChange = (event: SelectChangeEvent<string>) => {
		setSelectedChapterId(parseInt(event.target.value, 10));
	};

	const handleNextChapter = () => {
		saveDraftForChapter(selectedChapterId, draftText);
		createNewChapter();
	};

	// If no bookId is provided, render a basic view.
	if (!bookId) {
		return (
			<div className="p-4 text-center">
				<Typography variant="h6">No Book Selected</Typography>
				<Button variant="contained" color="primary" onClick={onCreateBook}>
					Create New Book
				</Button>
			</div>
		);
	}

	return (
		<div className="p-4">
			{/* Mobile View */}
			<div className="md:hidden">
				<div className="mb-4">
					{loading ? (
						<CircularProgress size={24} />
					) : (
						<Select
							value={selectedChapterId.toString()}
							onChange={handleMobileSelectChange}
							variant="outlined"
							fullWidth
						>
							{chapters.map((chapter) => (
								<MenuItem key={chapter.position} value={chapter.position.toString()}>
									Chapter {chapter.position}
								</MenuItem>
							))}
						</Select>
					)}
				</div>
				<div className="flex gap-2">
					<TextField
						label="Chapter Content"
						variant="outlined"
						fullWidth
						value={draftText}
						onChange={(e) => setDraftText(e.target.value)}
						className="bg-white"
					/>
					<Button variant="contained" onClick={handleNextChapter}>
						Next Chapter
					</Button>
				</div>
			</div>

			{/* Desktop View */}
			<div className="hidden md:flex gap-4">
				{/* Chapter List */}
				<div className="w-48 border border-gray-300 rounded overflow-y-auto max-h-[300px]">
					{loading ? (
						<div className="flex justify-center p-4">
							<CircularProgress size={24} />
						</div>
					) : (
						<ul>
							{chapters.map((chapter) => (
								<li
									key={chapter.position}
									className={`cursor-pointer p-2 hover:bg-gray-100 ${
										chapter.position === selectedChapterId ? 'bg-gray-200 font-bold text-black' : ''
									}`}
									onClick={() => handleChapterClick(chapter)}
								>
									Chapter {chapter.position}
								</li>
							))}
						</ul>
					)}
				</div>
				{/* Editor */}
				<div className="flex-grow flex flex-col gap-2">
					<TextField
						label="Chapter Content"
						variant="outlined"
						multiline
						rows={10}
						fullWidth
						value={draftText}
						onChange={(e) => setDraftText(e.target.value)}
						className="bg-white"
					/>
					<div className="text-right">
						<Button variant="contained" onClick={handleNextChapter}>
							Next Chapter
						</Button>
					</div>
				</div>
			</div>
			{/* Modal for Chapter Switch Confirmation */}
			<ChapterSwitchModal
				open={pendingChapter !== null}
				onConfirm={confirmChapterSwitch}
				onCancel={cancelChapterSwitch}
			/>
		</div>
	);
};

export default BookEditor;
