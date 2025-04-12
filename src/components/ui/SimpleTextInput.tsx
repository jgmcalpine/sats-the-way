'use client';

import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface SimpleTextInputProps {
  onSubmit: (text: string) => void;
  label?: string;
  initialValue?: string;
}

export default function SimpleTextInput({
  onSubmit,
  label = "Write something...",
  initialValue = "",
}: SimpleTextInputProps) {
  const [textValue, setTextValue] = useState<string>(initialValue);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value);
  };

  const handleSubmit = () => {
    if (textValue.trim()) {
      onSubmit(textValue);
      // Clear the input after submission
      setTextValue('');
    } else {
      console.log("Input is empty, not submitting.");
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <TextField
        label={label} 
        variant="outlined"
        fullWidth 
        multiline 
        minRows={3}
        value={textValue}
        onChange={handleInputChange}
        sx={{ marginBottom: 2, bgcolor: 'white' }}
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSubmit}
      >
        Submit Text
      </Button>
    </Box>
  );
}