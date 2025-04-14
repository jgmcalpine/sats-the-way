'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import ndkInstance from '@/lib/nostr/ndk';
import NDK, { NDKRelay } from '@nostr-dev-kit/ndk';

interface NDKContextProps {
    ndk: NDK;
    isConnected: boolean;
    connect: () => Promise<void>;
}

const NDKContext = createContext<NDKContextProps | undefined>(undefined);

let connectionAttempted = false;

export function NDKProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);

    const connectToRelays = async () => {
        if (connectionAttempted) {
            console.log("NDK connection already attempted.");
            return;
        }
        connectionAttempted = true;

        try {
            console.log("Attempting to connect NDK instance...");

            // Listener for when *any* relay in the pool successfully connects
            ndkInstance.pool?.on('relay:connect', (relay: NDKRelay) => { // Added NDKRelay type hint
                console.log(`✅ Connected to ${relay.url}`);
                // Set global connected status to true if at least one connects
                setIsConnected(prev => !prev ? true : prev);

                // --- Attach specific listeners TO THE RELAY instance ---
                // Optional: Listener for specific relay disconnects (more granular than pool's)
                relay.on('disconnect', (reason?: string) => {
                    console.warn(`⬇️ Relay ${relay.url} disconnected. Reason: ${reason ?? 'Unknown'}`);
                    // Check if *all* relays are now disconnected before setting global state
                    if ((ndkInstance.pool?.connectedRelays().length ?? 0) === 0) {
                        console.log("All monitored relays seem disconnected.");
                        setIsConnected(false);
                    }
                });
                 // ------------------------------------------------------
            });

            // Listener for when *any* relay disconnects (less specific than relay.on('disconnect'))
            // This might be slightly redundant if you handle it within relay:connect's callback,
            // but can be useful as a fallback or simpler global check.
            ndkInstance.pool?.on('relay:disconnect', (relay: NDKRelay) => {
                 console.warn(`⬇️ Relay ${relay.url} disconnected (pool listener).`);
                 // Debounced or careful check if all are disconnected
                 if ((ndkInstance.pool?.connectedRelays().length ?? 0) === 0) {
                      console.log("All monitored relays seem disconnected (pool listener).");
                      setIsConnected(false);
                 }
            });

            // ---- REMOVED INCORRECT POOL ERROR LISTENER ----
            // ndkInstance.pool?.on('error', (relay, error) => { /* ... incorrect ... */ });

            await ndkInstance.connect();
            console.log("NDK connect() method finished.");

            const connectedRelayCount = ndkInstance.pool?.connectedRelays().length ?? 0;
            console.log(`Initial connected relays after connect(): ${connectedRelayCount}`);
            setIsConnected(connectedRelayCount > 0);

        } catch (error) {
            console.error("Failed to execute NDK connect():", error);
            setIsConnected(false); // Connection attempt failed
        }
    };

    useEffect(() => {
        connectToRelays();

        // Basic cleanup idea: remove listeners added directly to the pool
        return () => {
            console.log("NDKProvider unmounting...");
             // NDK doesn't provide a simple removeAllListeners for the pool easily accessible here.
             // Relying on WebSocket closure by the browser is usually sufficient.
             // Resetting flag might be needed if the provider itself can remount cleanly.
             // connectionAttempted = false;
        };
    }, []);

    const contextValue = useMemo(() => ({
        ndk: ndkInstance,
        isConnected,
        connect: connectToRelays,
    }), [isConnected]);

    return (
        <NDKContext.Provider value={contextValue}>
            {children}
        </NDKContext.Provider>
    );
}

export function useNDK(): NDKContextProps {
    const context = useContext(NDKContext);
    if (context === undefined) {
        throw new Error('useNDKContext must be used within an NDKProvider');
    }
    return context;
}