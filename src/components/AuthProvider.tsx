'use client';

import { fetchProfileMetadataFromRelays } from '@/lib/nostr/profile';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { WebLNProvider } from 'webln';

// ————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————

type User = {
  pubkey: string;
  name?: string;
  picture?: string;
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  /* Nostr (NIP‑07) */
  connectNostr: () => Promise<void>;
  disconnectNostr: () => void;
  /* Lightning / NWC */
  walletConnected: boolean;
  connectWallet: () => Promise<void>;
  payInvoice: (invoice: string) => Promise<void>;
}

// ————————————————————————————————————————————————————————
// Context
// ————————————————————————————————————————————————————————

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'nostrPubkey';

// ————————————————————————————————————————————————————————
// Provider
// ————————————————————————————————————————————————————————

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [webln, setWebln] = useState<WebLNProvider | null>(null);

  // Will hold dynamically‑imported bitcoin‑connect helpers
  const bcRef = useRef<{
    requestProvider: (() => Promise<WebLNProvider>) | null;
  } | null>(null);

  // ——— Bootstrap on mount ———
  useEffect(() => {
    const bootstrap = async () => {
      /* Restore cached Nostr user */
      const savedPubkey = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPubkey) {
        let user: User = { pubkey: savedPubkey };
        try {
          const profile = await fetchProfileMetadataFromRelays(savedPubkey);
          user = { ...user, ...profile };
        } catch (err) {
          console.error('Failed to load Nostr profile', err);
        }
        setCurrentUser(user);
      }

      /* Dynamically import bitcoin‑connect only in browser */
      if (typeof window !== 'undefined') {
        const bc = await import('@getalby/bitcoin-connect-react');
        bc.init({ appName: 'SatsTheWay' });
        bcRef.current = { requestProvider: bc.requestProvider };

        const unsubConnect = bc.onConnected((prov: WebLNProvider) => setWebln(prov));
        const unsubDisconnect = bc.onDisconnected(() => setWebln(null));

        return () => {
          unsubConnect();
          unsubDisconnect();
        };
      }
    };

    bootstrap().finally(() => setLoading(false));
  }, []);

  // ——— Nostr helpers ———
  const connectNostr = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nip07 = (window as any).nostr;
    if (!nip07) throw new Error('NIP‑07 extension not found');
    const pubkey: string = await nip07.getPublicKey();
    localStorage.setItem(LOCAL_STORAGE_KEY, pubkey);

    let user: User = { pubkey };
    try {
      const profile = await fetchProfileMetadataFromRelays(pubkey);
      user = { ...user, ...profile };
    } catch (err) {
      console.error('Failed to load Nostr profile', err);
    }
    setCurrentUser(user);
  };

  const disconnectNostr = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setCurrentUser(null);
  };

  // ——— Lightning helpers ———
  const walletConnected = !!webln;

  const connectWallet = async () => {
    if (walletConnected) return;
    if (!bcRef.current?.requestProvider) throw new Error('Wallet functions not ready');
    const prov = await bcRef.current.requestProvider();
    setWebln(prov);
  };

  const payInvoice = async (invoice: string) => {
    if (!webln) await connectWallet();
    if (!webln) throw new Error('No WebLN provider available');
    await webln.sendPayment(invoice);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        connectNostr,
        disconnectNostr,
        walletConnected,
        connectWallet,
        payInvoice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ————————————————————————————————————————————————————————
// Hook
// ————————————————————————————————————————————————————————

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
