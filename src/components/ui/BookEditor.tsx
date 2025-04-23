import React, { useState } from 'react';
import { 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  TextField,
  Typography,
  ListItemButton,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import { Bolt as BoltIcon, CurrencyBitcoin as CurrencyBitcoinIcon } from '@mui/icons-material';

import { EditableText } from '@/components/ui/EditableText';
import { isValidLightningAddress } from '@/utils/lightning';

interface Chapter {
  fee: number | null;
  id: number | null;
  title?: string | null;
}

export interface BookData {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: Chapter[];
}

interface BookEditorProps {
  book: BookData;
  onSave: (content: string, currentChapterId: number | null) => void;
  onNewChapter: () => void;
}

const BookEditor: React.FC<BookEditorProps> = ({ book, onSave, onNewChapter }) => {
  const [content, setContent] = useState<string>('');
  const [lightningAddress, setLightningAddress] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(
    book.chapters.length > 0 ? book.chapters[0].id : null
  );

  const hasValidLightningAddress = isValidLightningAddress(lightningAddress);

  const handleChapterSelect = (chapterId: number | null) => {
    setSelectedChapterId(chapterId);
    // In a real implementation, you would load the chapter content here
    // For now, we'll just clear the content when switching chapters
    setContent('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSave = () => {
    onSave(content, selectedChapterId);
  };

  return (
    <div className="flex justify-center w-full mt-8">
      <div className="relative flex w-full max-w-5xl">
        {/* Book background with shadow */}
        <div className="absolute inset-0 bg-amber-50 rounded-lg shadow-2xl transform -skew-x-1" />
        
        {/* Book content container */}
        <div className="relative flex w-full rounded-lg overflow-hidden">
          {/* Left page - Chapter list */}
          <Paper elevation={0} className="flex-1 bg-amber-50 pt-8 pb-4 px-6 rounded-l-lg border-r border-amber-200">
			<Box display="flex" justifyContent="center">
			  <EditableText placeholder='Add a title' value={book.title} onSave={() => console.log("updat the title")} textProps={{ variant: "h4" }} className="mb-4 text-center font-serif text-amber-900 text-4xl w-full" />
			</Box>
			<Box display="flex" alignItems="center" gap={2}>
			  <Tooltip title="Add your lightning address here">
				<BoltIcon color="primary" />
			  </Tooltip>
			  <EditableText placeholder='ex:myaddress@getalbi.com' className='w-full' onSave={(val: string) => setLightningAddress(val)} value={lightningAddress} />
			</Box>
            
            <Typography variant="h6" className="mb-2 font-serif text-amber-900">
              Chapters
            </Typography>
            
            <div className="max-h-96 overflow-y-auto pr-2">
              <List>
                {book.chapters.map((chapter, index) => (
                  <ListItem key={`chapter-${index}`} disablePadding>
                    <ListItemButton
                      selected={selectedChapterId === chapter.id}
                      onClick={() => handleChapterSelect(chapter.id)}
                      className={`rounded ${
                        selectedChapterId === chapter.id ? 'bg-amber-200' : ''
                      }`}
                    >
					  <Box className="flex justify-between items-center w-full">
						<EditableText placeholder='Chapter title' onSave={(title: string) => console.log("Update the chapter title", title)} value={ chapter.title ? `${chapter.title}` : `Chapter ${index + 1}`} />
						<Tooltip arrow disableFocusListener={hasValidLightningAddress} title={hasValidLightningAddress ? '' : "Add a valid lightning address to set chapter fees"}>
							<span className="flex items-center justify-center">
								<CurrencyBitcoinIcon color="secondary" />
								<EditableText placeholder='How many sats?' value={chapter.fee ? `${chapter.fee}` : 'Free'} onSave={(newPrice: string) => console.log("save the new value: ", newPrice)} />
							</span>
						</Tooltip>
					  </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </div>
          </Paper>
          
          {/* Right page - Content editor */}
          <Paper elevation={0} className="flex-1 bg-amber-50 pt-8 pb-4 px-6 rounded-r-lg flex flex-col">
            <Typography variant="h6" className="mb-4 font-serif text-amber-900">
              {selectedChapterId !== null 
                ? `Chapter ${book.chapters.findIndex(ch => ch.id === selectedChapterId) + 1}` 
                : 'No Chapter Selected'}
            </Typography>
            
            <TextField
              multiline
              fullWidth
              minRows={12}
              maxRows={12}
              value={content}
              onChange={handleContentChange}
              placeholder="Write your chapter content here..."
              variant="outlined"
              className="flex-grow mb-4"
              sx={{
                '.MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #f3e8c8',
                }
              }}
            />
            
            <div className="flex justify-end space-x-4 mt-auto">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={onNewChapter}
                className="bg-amber-700 hover:bg-amber-800"
              >
                New Chapter
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave}
                disabled={selectedChapterId === null}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Save
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default BookEditor;