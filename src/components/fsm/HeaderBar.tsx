import { Box, Button, CircularProgress, TextField, Tooltip } from "@mui/material";
import { Save, Publish } from "@mui/icons-material";
import React from "react";

interface Props {
  title: string;
  description: string;
  setTitle: (t: string) => void;
  setDescription: (d: string) => void;
  onSave?: () => void;
  onPublish?: () => void;
  isSaving: boolean;
  isPublishing: boolean;
}

export const HeaderBar: React.FC<Props> = ({
  title,
  description,
  setTitle,
  setDescription,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
}) => (
  <Box className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <Box className="flex-1 flex flex-col gap-2">
      <TextField
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Book title…"
        fullWidth
        variant="standard"
        InputProps={{ className: title ? "" : "animate-pulse" }}
      />
      <TextField
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        fullWidth
        variant="standard"
        multiline
        maxRows={3}
      />
    </Box>
    <Box className="flex gap-2 self-start sm:self-auto">
      {onSave && (
        <Tooltip title="Save draft">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={isSaving ? <CircularProgress size={18} /> : <Save />}
              disabled={isSaving || isPublishing}
              onClick={onSave}
            >
              Save
            </Button>
          </span>
        </Tooltip>
      )}
      {onPublish && (
        <Tooltip title="Publish book">
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={isPublishing ? <CircularProgress size={18} /> : <Publish />}
              disabled={isSaving || isPublishing}
              onClick={onPublish}
            >
              Publish
            </Button>
          </span>
        </Tooltip>
      )}
    </Box>
  </Box>
);
