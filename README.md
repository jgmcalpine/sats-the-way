# Sats the way

## Overview

This project aims to create an open standard for nostr, allowing for execution of finite state machines. It includes an example implementation, a platform for writing and reading choose-your-own-adventure stories. Authors can set paywalls for specific choices throughout the story which readers must pay (currently using QR codes generated from an lnurlp address, future upgrade will use NWC) in order to advance.

## 📚 Custom Nostr Event Kinds — FSM (Finite State Machine) Protocol

This project defines two custom Nostr event kinds to support decentralized Finite State Machine (FSM) structures, useful for interactive books, games, courses, or any branching narrative content.

---

## 🧠 Event Kind: `30077` — FSM Metadata

**Purpose:**  
Defines the metadata for a published Finite State Machine (FSM) instance.

**Content JSON Format:**

\`\`\`json
{
  "fsm_type": "book",
  "fsm_id": "9296c3e6-05cb-472c-b548-46857f3b8182",
  "title": "Untitled Book",
  "description": "Optional description of the FSM",
  "author_pubkey": "npub1....",
  "start_state_id": "011c86f2-4be9-43e2-8dfc-c7401c70615d",
  "lnurlp": "lnurl1....", 
  "min_cost": 1500,
  "lifecycle": "published" 
}
\`\`\`

**Required Tags:**

- \`["d", "<fsm_id>"]\` — Unique identifier for the FSM (used for finding and linking nodes).

**Fields Explained:**

| Field | Meaning |
| :--- | :--- |
| \`fsm_type\` | General classification (e.g., "book", "game", "workflow") |
| \`fsm_id\` | Unique UUID for the FSM |
| \`title\` | Title of the FSM |
| \`author_pubkey\` | Nostr pubkey of the FSM creator |
| \`start_state_id\` | ID of the starting node |
| \`lifecycle\` | 'draft' or 'published' — current publishing status |
| \`description\` | (Optional) Description or summary |
| \`lnurlp\` | (Optional) Lightning address for handling paid transitions |
| \`min_cost\` | (Optional) Minimum sats needed to complete FSM (from first step to first ending step) |

---

## 🧠 Event Kind: `30078` — FSM Node (State) Metadata

**Purpose:**  
Defines a single node (state) inside an FSM, including text content and transitions to other states.

**Content JSON Format:**

\`\`\`json
{
  "state_id": "some-uuid",
  "fsm_id": "linked-fsm-id",
  "name": "Chapter 1",
  "content": "Full text of the chapter or node",
  "is_end_state": false,
  "previous_state_id": "optional-previous-state-uuid",
  "price": 0,
  "transitions": [
    {
      "id": "transition-uuid",
      "choice_text": "Go left into the woods",
      "target_state_id": "next-state-uuid",
      "price": 300
    },
    {
      "id": "transition-uuid-2",
      "choice_text": "Head towards the river",
      "target_state_id": "another-next-state-uuid"
    }
  ]
}
\`\`\`

**Required Tags:**

- \`["d", "<state_id>"]\` — Unique identifier for the FSM node (state).
- \`["a", "<kind>:<author_pubkey>:<state_id>"]\` — Standard address for the node.
- \`["a", "<fsm_kind>:<author_pubkey>:<fsm_id>", "", "root"]\` — Link to parent FSM metadata.

**Fields Explained:**

| Field | Meaning |
| :--- | :--- |
| \`state_id\` | Unique UUID for this state |
| \`fsm_id\` | UUID linking to the parent FSM |
| \`name\` | Title or label for the state |
| \`content\` | Main body text of the chapter/node |
| \`is_end_state\` | Boolean indicating if this is a terminal state |
| \`previous_state_id\` | (Optional) ID of the previous state (for backtracking) |
| \`price\` | Optional number of sats required to enter this state |
| \`transitions\` | Array of available choices leading to other states |

---

# 📋 Notes on Usage

- FSM Metadata (30077) must be published before related State Nodes (30078).
- Transitions may include optional prices (sats) if using paid branching paths.
- FSMs are extensible to many types of experiences: books, games, training paths, etc.
- \`lnurlp\` integration enables decentralized Lightning payments for unlocking content.
- Readers start at \`start_state_id\` and proceed by selecting transitions.
- Authors can gate certain transitions with Lightning payments.

---

## 📋 Reserved Tags Usage

| Tag | Meaning |
| :--- | :--- |
| \`d\` | Document identifier (\`fsm_id\` or \`state_id\`) |
| \`a\` | Standard addressable Nostr entity |

Tags allow easy querying, filtering, and linking across FSM data structures.

---

## 📋 Future Enhancements

- Zap Receipts (NIP-57): Payment receipts linked to FSM transitions.
- NWC Preimage Unlocking: Cryptographic unlocking of states via preimage proofs.
