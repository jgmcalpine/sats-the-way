import { Publish, Save } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Paper, TextField } from '@mui/material';
import React from 'react';

interface Props {
  title: string;
  lnurlp: string;
  description: string;
  authorName: string;
  setTitle: (t: string) => void;
  setLNUrlp: (a: string) => void;
  setDescription: (d: string) => void;
  setAuthorName: (name: string) => void;
  isSaving: boolean;
  isPublishing: boolean;
  validationErrors: string[];
  onSave?: () => void;
  onPublish?: () => void;
}

export const HeaderBar: React.FC<Props> = ({
  title,
  lnurlp,
  authorName,
  description,
  setTitle,
  setAuthorName,
  setDescription,
  setLNUrlp,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  validationErrors,
}) => (
  <Paper className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4">
    <Box className="flex-1 flex flex-col gap-4 p-4">
      <TextField
        value={title}
        label="Title"
        onChange={e => setTitle(e.target.value)}
        placeholder="Book title"
        fullWidth
        variant="outlined"
      />
      <TextField
        value={authorName}
        onChange={e => setAuthorName(e.target.value)}
        placeholder="Author name"
        fullWidth
        label="Author"
        variant="standard"
      />
      <TextField
        value={lnurlp}
        onChange={e => setLNUrlp(e.target.value)}
        placeholder="LNURL pay (if you are setting prices)"
        fullWidth
        label="lnurl-pay"
        variant="standard"
      />
      <TextField
        value={description}
        label="description"
        onChange={e => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        fullWidth
        variant="standard"
        multiline
        maxRows={3}
      />
    </Box>
    <Box className="flex flex-col gap-2 self-start sm:self-auto py-2">
      {validationErrors.length > 0 && (
        <Alert severity="warning" className="mb-4 flex justify-center items-center">
          <ul className="list-disc list-inside text-sm text-gray-800">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
      <Box className="flex gap-2 justify-end px-4">
        {onSave && (
          <Button
            variant="outlined"
            size="small"
            startIcon={isSaving ? <CircularProgress size={18} /> : <Save />}
            disabled={isSaving || isPublishing}
            onClick={onSave}
            fullWidth
          >
            Save
          </Button>
        )}
        {onPublish && (
          <Button
            variant="contained"
            size="small"
            startIcon={isPublishing ? <CircularProgress size={18} /> : <Publish />}
            disabled={isSaving || isPublishing || validationErrors.length > 0}
            onClick={onPublish}
            fullWidth
          >
            Publish
          </Button>
        )}
      </Box>
    </Box>
  </Paper>
);
