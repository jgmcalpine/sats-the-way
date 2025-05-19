import { Box, Link, Typography } from '@mui/material';

import LayoutWrapper from '@/components/LayoutWrapper';

export default function AboutPage() {
  return (
    <LayoutWrapper>
      <Box className="flex flex-col w-full p-4">
        <Box className="flex flex-col gap-8">
          <Typography
            color="primary"
            className="grow flex justify-center items-center"
            variant="h3"
            component="h1"
          >
            SatsTheWay
          </Typography>
          <Typography variant="h6" component="h2">
            A platform for publishing and reading choose-your-own-adventure stories with native
            bitcoin payments and openly available to any nostr client.
          </Typography>
          <Typography variant="body1">
            Neither bitcoin or nostr are required to{' '}
            <Link underline="hover" color="#6303F2" href="/read">
              read
            </Link>{' '}
            free content on SatsTheWay. To fully experience the application, one can connect a nostr
            account (to publish a story) and lightning wallet (to pay for stories that implement
            paywalls and receive payments for your work).
          </Typography>
          <Typography variant="body1">
            As always do your own research. For very quick lightning setup we have used{' '}
            <Link color="#6303F2" underline="hover" href="https://www.coinos.io">
              coinos.io
            </Link>{' '}
            and found it very user friendly. If you are just testing the application or dipping your
            toes into lightning with small amounts, this is a simple way to experience it.
          </Typography>
          <Typography variant="body1">
            To publish a story, a nostr account must be connected. This is so we can create events
            (books and chapters). In order to connect, please install a browser extension that works
            as a nip-07 signer. DYOR rigby,{' '}
            <Link color="#6303F2" underline="hover" href="https://github.com/fiatjaf/nos2x">
              Nos2x
            </Link>{' '}
            and{' '}
            <Link
              color="#6303F2"
              underline="hover"
              href="https://github.com/getAlby/lightning-browser-extension"
            >
              Alby
            </Link>{' '}
            have worked for us.
          </Typography>
          <Typography variant="body1">
            Finally, if you publish a story and would like to paywall certain paths, you will need
            to add a lightning url pay (lnurl-pay) address. Coinos will generate one quickly. If you
            end up using this and making money, you may want to consider non-custodial options.
          </Typography>
        </Box>
      </Box>
    </LayoutWrapper>
  );
}
