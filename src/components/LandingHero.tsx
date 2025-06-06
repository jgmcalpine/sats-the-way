import { Box, Typography } from '@mui/material';
import Image from 'next/image';

export default function LandingHero() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <Image
          src="/hero-library.webp"
          alt="Divergent paths leading to and from a library"
          fill
          priority
          placeholder="blur"
          // Next.js auto-generates this if image is in /public
          blurDataURL="/hero-library.webp"
          style={{
            objectFit: 'cover',
            transition: 'filter 0.5s ease-out',
            filter: 'blur(0px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        />
      </Box>

      {/* Text overlay */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          color: 'white',
          px: 3,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          fontFamily="Georgia"
          sx={{
            typography: {
              xs: 'h2',
              md: 'h1',
            },
            textShadow: '2px 2px 6px rgba(0,0,0,0.7)',
            fontWeight: 'bold',
          }}
        >
          Tell every Tale
        </Typography>
        <Typography
          variant="h6"
          component="p"
          sx={{
            mt: 2,
            maxWidth: '600px',
            textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          Explore stories and choose your path through the infinite library.
        </Typography>
      </Box>
    </Box>
  );
}
