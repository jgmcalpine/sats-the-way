'use client';
import theme from '@/theme';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
