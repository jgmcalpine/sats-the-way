'use client';
import { Box, Button, Link, Typography } from '@mui/material';
import Image from 'next/image';

import LandingHero from '@/components/LandingHero';
import LayoutWrapper from '@/components/LayoutWrapper';

export default function Home() {
  return (
    <div className="pb-48">
      <LandingHero />
      <LayoutWrapper>
        <Box className="flex flex-col gap-32">
          <Box className="w-full p-4">
            <Box className="flex flex-col md:flex-row gap-8">
              <Box className="w-full md:w-1/2">
                <Typography variant="h4" gutterBottom>
                  Create your own adventures
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Craft stories with forking paths, or one single way through. Set paywalls anywhere
                  throughout your work or let users read your tales for free.
                </Typography>
                <Typography variant="body1" gutterBottom>
                  The choice is yours.
                </Typography>
                <Button variant="outlined">
                  <Link underline="none" href="/write">
                    Get Started
                  </Link>
                </Button>
              </Box>

              <Box className="w-full md:w-1/2 flex justify-center items-center mt-4 md:mt-0">
                <Box className="relative w-full h-64 md:h-80">
                  <Image
                    src="/mountain-fork.webp"
                    alt="Forking path through the mountains"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          <Box className="flex flex-col md:flex-row gap-8">
            <Box className="w-full md:w-1/2 flex justify-center items-center mt-4 md:mt-0">
              <Box className="relative w-full h-64 md:h-80">
                <Image
                  src="/dark-jungle.webp"
                  alt="Two paths through a dark jungle"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </Box>
            </Box>
            <Box className="w-full md:w-1/2">
              <Typography variant="h4" gutterBottom>
                Choose your own path
              </Typography>
              <Typography variant="body1" gutterBottom>
                Find free stories on topics that interest you most. Or challenge yourself to find
                the best path through a forking story.
              </Typography>
              <Typography variant="body1" gutterBottom></Typography>
              <Button variant="outlined">
                <Link underline="none" href="/read">
                  Find a book
                </Link>
              </Button>
            </Box>
          </Box>
        </Box>
      </LayoutWrapper>
    </div>
  );
}
