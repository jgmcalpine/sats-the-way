import React, { useState, useEffect, useRef, useCallback } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography, { TypographyProps } from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';

// Define the props for the EditableText component
interface EditableTextProps {
  /** The initial value to display and edit */
  value: string;
  /** Callback function triggered when the save button is clicked or Enter is pressed.
   * Receives the new value. Can be async.
   */
  onSave: (newValue: string) => void | Promise<void>;
  /** Optional placeholder text for the input field when empty */
  placeholder?: string;
  /** Optional props to pass directly to the MUI TextField component */
  inputProps?: Omit<TextFieldProps, 'value' | 'onChange' | 'onKeyDown' | 'inputRef'>;
  /** Optional props to pass directly to the MUI Typography component for display mode */
  textProps?: Omit<TypographyProps, 'onClick' | 'children' | 'sx'>;
   /** Optional TailwindCSS classes to apply to the root container element */
  className?: string;
  /** Optional ARIA label for the input field for accessibility */
  ariaLabel?: string;
  /** Text to display when the value is empty in display mode */
  emptyDisplayText?: string;
}

/**
 * A component that displays text, allowing inline editing
 * by clicking on it, and saving with an inline button or Enter key.
 * Uses MUI components and TailwindCSS for layout.
 */
export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  placeholder = 'Enter value...',
  inputProps = {},
  textProps = {},
  className = '',
  ariaLabel = 'Editable text field',
  emptyDisplayText = 'Enter lightning address',
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue if the external value prop changes *while not editing*
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Timeout helps ensure the element is fully rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Select all text for easy replacement
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleEnableEditing = useCallback(() => {
    setEditValue(value); // Reset edit value to current prop value on edit start
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(async () => {
    // Only save if the value has actually changed or if explicitly saving (e.g., maybe API needs it)
    // Trim whitespace before comparison and saving
    const trimmedValue = editValue.trim();
    if (trimmedValue !== value.trim()) {
        try {
            await onSave(trimmedValue);
        } catch (error) {
            console.error("Failed to save editable text:", error);
            // Optionally: Add error handling state/UI feedback here
            // For now, we still exit editing mode
        }
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission if wrapped in one
      handleSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsEditing(false); // Cancel editing on Escape
      setEditValue(value); // Reset to original value
    }
  };

  return (
    <Box className={`inline-block ${className}`}>
      {isEditing ? (
        // --- Edit Mode ---
        <div className="flex items-center space-x-1">
          <TextField
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            variant="standard" // Standard variant looks cleaner for inline editing
            size="small"
            placeholder={placeholder}
            inputRef={inputRef}
            aria-label={ariaLabel}
            sx={{
                // Minimal styling, let parent control width if needed
                // Or add flex-grow if it should expand
                 minWidth: '100px', // Ensure a minimum width
                 width: '100%',
                 flexGrow: 1, // Allow it to grow if space is available
                 // Remove underline hover effect unless focused
                 '& .MuiInput-underline:before': { borderBottom: '1px solid rgba(0, 0, 0, 0.2)' },
                 '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: '1px solid rgba(0, 0, 0, 0.4)' },
            }}
            {...inputProps} // Spread any additional input props
            autoFocus // Note: AutoFocus might not work reliably without the useEffect/setTimeout trick
          />
          <IconButton
            onClick={handleSave}
            size="small"
            color="primary"
            aria-label="Save change"
            sx={{ padding: '4px' }} // Adjust padding for visual balance
            >
            <CheckIcon fontSize="small" />
          </IconButton>
        </div>
      ) : (
        // --- Display Mode ---
        <Typography
          onClick={handleEnableEditing}
          sx={{
            cursor: 'pointer',
            minHeight: '28px', // Match approx height of input+button for less layout shift
            display: 'flex',
            alignItems: 'center',
            padding: '4px 6px', // Add some padding for easier clicking
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)', // Subtle hover effect
            },
            // Handle potential line breaks gracefully
             whiteSpace: 'pre-wrap', // Respect newlines
             wordBreak: 'break-word', // Break long words
          }}
          {...textProps} // Spread any additional text props
        >
          {value || editValue ? (value || editValue) : <span className="text-gray-500 italic">{emptyDisplayText}</span>}
        </Typography>
      )}
    </Box>
  );
};