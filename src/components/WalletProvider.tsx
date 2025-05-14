'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** ------------------------------------------------------
 *  Types
 * -----------------------------------------------------*/
export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'error';

export interface WalletIdleState {
  status: 'idle';
}
export interface WalletConnectingState {
  status: 'connecting';
}
export interface WalletReadyState {
  status: 'ready';
  /** The active WebLN provider returned by Bitcoin‑Connect */
  provider: WebLNProviderLike;
}
export interface WalletErrorState {
  status: 'error';
  error: Error;
}

export type WalletState =
  | WalletIdleState
  | WalletConnectingState
  | WalletReadyState
  | WalletErrorState;

/**
 * Minimal contract we rely on from a WebLN provider.  `@getalby/bitcoin-connect`
 * returns classes that satisfy this interface.
 */
export interface WebLNProviderLike {
  sendPayment: (invoice: string) => Promise<{ preimage?: string; paymentHash?: string }>;
  makeInvoice?: (
    amountSats: number,
    opts?: { description?: string }
  ) => Promise<{ paymentRequest: string; rHash: string }>;
}

export interface WalletContextValue {
  state: WalletState;
  /** Ensure we expose the provider directly for callers who need extra WebLN methods */
  connect: () => Promise<WebLNProviderLike>;
  payInvoice: (bolt11: string) => Promise<void>;
  resetError: () => void;
}

/** ------------------------------------------------------
 *  Internal helpers
 * -----------------------------------------------------*/
const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
};

/** ------------------------------------------------------
 *  Provider component
 * -----------------------------------------------------*/
export interface WalletProviderProps {
  children: React.ReactNode;
  /**
   * Name shown to NWC / wallets while requesting permission. Keep it short.
   */
  appName?: string;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children, appName = 'SatsTheWay' }) => {
  const [state, setState] = useState<WalletState>({ status: 'idle' });
  const hasInitialised = useRef(false);

  /**
   * Initialise Bitcoin‑Connect **once on mount**, but entirely on the client –
   * we use dynamic import to avoid any SSR window access.
   */
  useEffect(() => {
    if (hasInitialised.current) return;
    (async () => {
      const bc = await import('@getalby/bitcoin-connect');
      bc.init({ appName });
      hasInitialised.current = true;
    })();
  }, [appName]);

  /** --------------------------------------------------
   *  Public actions
   * --------------------------------------------------*/
  const connect = useCallback(async (): Promise<WebLNProviderLike> => {
    // Fast‑path: already connected
    if (state.status === 'ready') return state.provider;

    try {
      // Only set loading UI the *first* time. Subsequent calls while connecting
      // will await the same promise path.
      if (state.status !== 'connecting') setState({ status: 'connecting' });

      const bc = await import('@getalby/bitcoin-connect');
      const provider: WebLNProviderLike = await bc.requestProvider();
      setState({ status: 'ready', provider });
      return provider;
    } catch (err) {
      setState({ status: 'error', error: err as Error });
      throw err;
    }
  }, [state]);

  const payInvoice = useCallback(
    async (invoice: string): Promise<void> => {
      // Ensure we *always* have a provider — connect() returns it.
      const provider: WebLNProviderLike =
        state.status === 'ready' ? state.provider : await connect();

      await provider.sendPayment(invoice);
    },
    [state, connect]
  );

  const resetError = useCallback(() => {
    if (state.status === 'error') setState({ status: 'idle' });
  }, [state.status]);

  const value: WalletContextValue = {
    state,
    connect,
    payInvoice,
    resetError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export default WalletProvider;
