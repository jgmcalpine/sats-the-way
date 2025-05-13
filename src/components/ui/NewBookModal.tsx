import { Box, Button, Modal, Stack, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

interface FormData {
  title: string;
  description: string;
  dedication: string;
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const FormModal: React.FC<FormModalProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    dedication: '',
  });

  const [titleError, setTitleError] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error if title is being typed
    if (name === 'title' && value.trim() !== '') {
      setTitleError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    if (formData.title.trim() === '') {
      setTitleError(true);
      return;
    }

    // Pass data to callback
    onSubmit(formData);

    // Reset form
    setFormData({
      title: '',
      description: '',
      dedication: '',
    });

    // Close modal
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="form-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography id="form-modal-title" variant="h5" component="h2" mb={2} color="primary">
          Create New Book
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
              error={titleError}
              helperText={titleError ? 'Title is required' : ''}
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
            />

            <TextField
              label="Dedication"
              name="dedication"
              value={formData.dedication}
              onChange={handleChange}
              fullWidth
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={onClose} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default FormModal;
