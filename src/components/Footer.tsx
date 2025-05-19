import { Box, Container, Link, Stack, Typography } from '@mui/material';
import Image from 'next/image';

const Footer = () => {
  return (
    <Box component="footer" bgcolor="#FDF5E6" className="w-full py-6 text-black">
      <Container maxWidth="lg" className="px-4">
        <Box className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-6 sm:space-y-0">
          <Box bgcolor="secondary" className="bg-[#8A3FFC] w-full sm:w-1/3 flex items-center gap-4">
            <Image
              src="/logo.webp"
              alt="Open Path"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
          </Box>

          <Box className="w-full flex flex-col justify-center items-end" color="text.primary">
            <Stack direction="row" spacing={3} className="mb-4">
              <Link
                href="/read"
                underline="hover"
                className="text-[#714F09]! no-underline font-medium"
              >
                Read
              </Link>
              <Link
                href="/write"
                underline="hover"
                className="text-[#714F09]! no-underline font-medium"
              >
                Write
              </Link>
              <Link
                href="/about"
                underline="hover"
                className="text-[#714F09]! no-underline font-medium"
              >
                About
              </Link>
            </Stack>

            <Typography variant="body2">Sats are just bitcoin.</Typography>
            <Typography variant="body2">Bitcoin leads TheWay.</Typography>
          </Box>
        </Box>

        <Box className="mt-8 pt-4 border-t border-gray-700" color="text.primary">
          <Typography variant="caption">Built for Bitcoin © {new Date().getFullYear()}</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
