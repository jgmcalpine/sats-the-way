// =============================================================
// File: src/lib/nostr/constants.ts
// Description: Numeric constants and helper enums shared across
//              your Nostr‑Lightning “Choose‑Your‑Own‑Adventure” app.
// =============================================================

/**
 * Application‑specific, parameterised‑replaceable kinds.
 * 30077 → Book / FSM‑root metadata
 * 30078 → Node / Chapter state
 */
export const BOOK_KIND: number = 30077;
export const NODE_KIND: number = 30078;

// Tag names reused throughout the spec
export enum NostrTag {
	D = "d",      // Unique identifier inside a kind (NIP‑33)
	B = "b",      // Foreign key → bookId
	P = "p",      // Pubkey (author / co‑author)
	T = "t",      // Topic / free‑form hashtag
	R = "r",      // External resource (cover image, etc.)
	PRICE = "price", // Sats to finish story (book‑level)
	START = "start", // First nodeId in the FSM
	PAY = "pay",  // Sats required before decrypt (node‑level)
	ENC = "enc"   // "1" if content is encrypted
}

