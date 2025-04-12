import ndkInstance from '@/lib/nostr/ndk'; 
import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

export type ProfileMetadata = {
    name?: string;
    about?: string;
    picture?: string;
    nip05?: string;
    lud06?: string; // lnurl pay string
    lud16?: string; // lightning address
    displayName?: string; // Often used alongside or instead of name
    banner?: string;
    website?: string;
    // Allow any other properties that might be in the kind 0 content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

/**
 * Fetches Nostr profile metadata (kind:0) using the NDK singleton
 * for a given pubkey. Leverages NDK's caching and connection management.
 */
export async function fetchProfileMetadataFromRelays(
  pubkey: string
): Promise<ProfileMetadata | null> {

  // Basic validation
  if (!pubkey || typeof pubkey !== 'string' || pubkey.length < 60) { // Simple check
      console.error("fetchProfileMetadataFromRelays: Invalid pubkey provided.", pubkey);
      return null;
  }

  console.log(`Fetching profile metadata for pubkey: ${pubkey} using NDK instance...`);
  // Relays are managed by the imported ndkInstance.

  try {
    const user = ndkInstance.getUser({ pubkey });
    const profile: NDKUserProfile | null = await user.fetchProfile();

    if (!profile || Object.keys(profile).length === 0) {
      console.log(`No profile metadata found via NDK for pubkey: ${pubkey}`);
      return null;
    }

    console.log("NDK returned metadata: ", profile);

    return profile as ProfileMetadata;

  } catch (error) {
    console.error(`Error fetching profile metadata for ${pubkey} using NDK:`, error);
    return null;
  }
}