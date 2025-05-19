import { Box, Container, Link, Stack, Typography } from '@mui/material';
import Image from 'next/image';

const Footer = () => {
  return (
    <Box component="footer" className="w-full bg-slate-800 text-white py-6">
      <Container maxWidth="lg" className="px-4">
        <Box className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-6 sm:space-y-0">
          <Box className="w-full sm:w-1/3 flex items-center gap-4">
            <Image
              src="/logo.webp"
              alt="Open Path"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <Typography variant="body1" className="ml-2 font-bold text-white">
              Bitcoin
            </Typography>
          </Box>

          <Box className="w-full flex flex-col justify-center items-end">
            <Stack direction="row" spacing={3} className="mb-4">
              <Link
                href="/read"
                className="!text-white hover:!text-amber-300 no-underline font-medium"
              >
                Read
              </Link>
              <Link
                href="/write"
                className="!text-white hover:!text-amber-300 no-underline font-medium"
              >
                Write
              </Link>
              <Link
                href="/about"
                className="!text-white hover:!text-amber-300 no-underline font-medium"
              >
                About
              </Link>
            </Stack>

            <Typography variant="body2" className="text-gray-300">
              Sats are just bitcoin.
            </Typography>
          </Box>
        </Box>

        <Box className="mt-8 pt-4 border-t border-gray-700">
          <Typography variant="caption" className="text-gray-400">
            © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
