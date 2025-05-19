'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: { default: '#FDF5E6', paper: '#FFFFFF' },
    text: { primary: '#2E2E2E', secondary: '#5C5C5C' },
    primary: { main: '#714F09' },
    secondary: { main: '#8A3FFC' },
    success: { main: '#2C6A60' },
    warning: { main: '#8A4800' },
    error: { main: '#B2323A' },
  },
  // add typography, components overrides, etc. here
});

export default theme;
