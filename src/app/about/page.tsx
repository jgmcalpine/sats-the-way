import { Box, Typography } from '@mui/material';

import LayoutWrapper from '@/components/LayoutWrapper';

export default function AboutPage() {
  return (
    <LayoutWrapper>
      <Box className="flex flex-col w-full">
        <Box>
          <Typography className="grow flex justify-center items-center" variant="h3">
            SatsTheWay
          </Typography>
          <Typography variant="h6">
            A platform for publishing and reading choose-your-own-adventure stories with native
            bitcoin payments and openly available to any nostr client.
          </Typography>
          <Typography variant="body1">
            SatsTheWay is built to be available to anyone, with no nostr or bitcoin elements
            required. To fully experience the application, one can connect a nostr account (to
            publish a story) and/or a lightning wallet (to pay for stories that implement paywalls).
          </Typography>
        </Box>
      </Box>
    </LayoutWrapper>
  );
}
