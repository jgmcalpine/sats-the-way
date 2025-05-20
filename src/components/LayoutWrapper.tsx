import { Box, Container, Paper } from '@mui/material';

export default function NonRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box className="min-h-screen bg-[#f5f1e6] text-gray-800" id="layout-root-here">
      <Container>
        <Box className="py-24">
          <Paper
            elevation={2}
            className="p-1 pt-8 md:p-8 md:pt-12 rounded-2xl shadow-md"
            sx={{
              backgroundColor: '#ffffffee',
              backdropFilter: 'blur(4px)',
              border: '1px solid #e0e0e0',
            }}
          >
            {children}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
