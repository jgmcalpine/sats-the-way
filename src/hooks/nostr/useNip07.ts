// hooks/useNip07.ts
import { useCallback, useEffect, useState } from 'react';

const KEY = 'nip07_pubkey';

interface Nip07State {
  isAvailable: boolean;
  pubkey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useNip07(): Nip07State {
  const [isAvailable, setAvail] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(KEY) : null
  );

  /* 1. detect extension */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).nostr) {
      setAvail(true);
    }
  }, []);

  /* 2. on mount, verify stored pubkey is still authorised */
  useEffect(() => {
    if (!isAvailable || !pubkey) return;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fresh = await (window as any).nostr.getPublicKey(); // silent if already authorised
        if (fresh !== pubkey) {
          localStorage.setItem(KEY, fresh);
          setPubkey(fresh);
        }
      } catch {
        // user revoked permission or extension missing → clean up
        localStorage.removeItem(KEY);
        setPubkey(null);
      }
    })();
  }, [isAvailable, pubkey]);

  /* connect */
  const connect = useCallback(async () => {
    if (!isAvailable) {
      alert('No NIP-07 wallet/extension detected. This is a paid chapter and requires payment.');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pk = await (window as any).nostr.getPublicKey();
      localStorage.setItem(KEY, pk);
      setPubkey(pk);
    } catch (err) {
      console.warn('User rejected NIP-07 permission', err);
    }
  }, [isAvailable]);

  /* disconnect helper */
  const disconnect = useCallback(() => {
    localStorage.removeItem(KEY);
    setPubkey(null);
  }, []);

  return { isAvailable, pubkey, connect, disconnect };
}
