// src/lib/ndk.ts
import NDK, { NDKRelaySet, NDKSigner, NDKUserProfile } from '@nostr-dev-kit/ndk';

// Define your default relays
const defaultRelays = [
    'wss://relay.damus.io',
    'wss://relay.primal.net',
    'wss://nos.lol',
    // Add more or load from configuration
];

/**
 * Represents the NDK singleton instance.
 */
const ndkInstance = new NDK({
    explicitRelayUrls: defaultRelays,
    // REMOVED: The 'debug' option that caused the error
    // debug: process.env.NODE_ENV === 'development',
});

// Type assertion to ensure we export the specific NDK instance type
const typedNdkInstance: NDK = ndkInstance;

// Export the singleton instance directly
export default typedNdkInstance;

// You can also re-export useful types if needed elsewhere
export type { NDKRelaySet, NDKSigner, NDKUserProfile };