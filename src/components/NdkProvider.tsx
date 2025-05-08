'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import NDK, { NDKNip07Signer } from '@nostr-dev-kit/ndk';

import defaultNdk from '@/lib/nostr/ndk';
import { useNip07 } from '@/hooks/nostr/useNip07';

interface NdkCtx {
  ndk: NDK;
  isConnected: boolean;
  /** Manually (re)connect to relays – usually not needed */
  connect: () => Promise<void>;
  /** Attach a NIP-07 signer if the user opens the connect modal */
  addSigner: () => Promise<void>;
}

const NdkContext = createContext<NdkCtx | null>(null);

type Props = {
  children: ReactNode;
  /**  for tests – inject a mock */
  instance?: NDK;
};

export function NdkProvider({ children, instance = defaultNdk }: Props) {
  const ndk = instance;
  const [isConnected, setConnected] = useState(false);
  const triedRef = useRef(false);
  const { pubkey } = useNip07();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (pubkey && !ndk.signer && typeof window !== 'undefined' && (window as any).nostr) {
      ndk.signer = new NDKNip07Signer();
    }
  }, [pubkey, ndk]);

  /** fire once */
  const connect = async () => {
    if (triedRef.current) return;
    triedRef.current = true;

    try {
      await ndk.connect();
    } catch (err) {
      console.error('NDK connect failed:', err);
    }
  };

  /** optional signer attachment */
  const addSigner = async () => {
    if (!window.nostr) {
      alert('NIP-07 extension not detected.');
      return;
    }
    if (!ndk.signer) {
      ndk.signer = new NDKNip07Signer();
    }
    // do a no-op call to trigger the permission popup:
    await ndk.signer.user();  
  };

  /** subscribe to pool status */
  useEffect(() => {
    connect();

    const pool = ndk.pool;
    if (!pool) return;

    const handleStatus = () =>
      setConnected(pool.connectedRelays().length > 0);

    pool.on('relay:connect', handleStatus);
    pool.on('relay:disconnect', handleStatus);

    // Call once for initial state
    handleStatus();

    return () => {
      pool.off('relay:connect', handleStatus);
      pool.off('relay:disconnect', handleStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ndk]);

  const value: NdkCtx = useMemo(
    () => ({ ndk, isConnected, connect, addSigner }),
    [ndk, isConnected, connect, addSigner]
  );

  return <NdkContext.Provider value={value}>{children}</NdkContext.Provider>;
}

/** convenient hook */
export function useNdk() {
  const ctx = useContext(NdkContext);
  if (!ctx) throw new Error('useNdk must be inside <NdkProvider>');
  return ctx;
}
