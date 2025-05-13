import { bech32 } from 'bech32';

type LNURLPayParams = {
  callback: string;
  minSendable: number;
  maxSendable: number;
  metadata: string;
  commentAllowed?: number;
};

type LNURLInvoiceResponse = {
  pr: string; // bolt11 invoice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routes: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successAction?: any;
  disposable?: boolean;
};

// 2. Fetch lnurl-pay params
export async function fetchLnurlPayParams(decodedUrl: string): Promise<LNURLPayParams> {
  const res = await fetch(decodedUrl);
  if (!res.ok) throw new Error('Failed to fetch LNURL pay params');
  return await res.json();
}

// 3. Request bolt11 invoice from lnurl callback
export async function fetchLnurlInvoice(
  callback: string,
  amountSat: number,
  comment?: string
): Promise<LNURLInvoiceResponse> {
  const url = new URL(callback);
  url.searchParams.append('amount', (amountSat * 1000).toString());

  if (comment) {
    url.searchParams.append('comment', comment);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch LNURL invoice');
  return await res.json();
}

export async function getPayUrl(lnurlOrAddress: string): Promise<string> {
  // Check if starts with lnurl1
  if (lnurlOrAddress.toLowerCase().startsWith('lnurl1')) {
    // Decode it
    const { words } = bech32.decode(lnurlOrAddress.toLowerCase(), 1500);
    const bytes = bech32.fromWords(words);
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  // Otherwise, treat as Lightning address
  if (lnurlOrAddress.includes('@')) {
    const [name, domain] = lnurlOrAddress.split('@');
    if (!name || !domain) {
      throw new Error('Invalid Lightning address');
    }

    const url = `https://${domain}/.well-known/lnurlp/${name}`;

    return url;
  }

  throw new Error('Invalid LNURL or Lightning address format');
}
