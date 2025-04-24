import { BookData } from "@/components/ui/BookShelf";

export const mockBooks: BookData[] = [
    {
      id: "book-1",
      title: "The Silent Echo",
      author: "Elena Michaels",
      description: "In a world where memories can be stored and shared, detective Sarah Cole investigates a series of missing memory fragments that lead to a conspiracy threatening the very fabric of reality. The Silent Echo explores themes of identity, truth, and the consequences of digitizing our most intimate experiences.",
      chapters: [
        { fee: null, id: 1 }, // Free chapter
        { fee: 2.99, id: 2 },
        { fee: 2.99, id: 3 },
        { fee: 3.99, id: 4 },
        { fee: 3.99, id: 5 }
      ]
    },
    {
      id: "book-2",
      title: "Quantum Gardens",
      author: "Marcus Wei",
      description: "Dr. Amara Singh's breakthrough in quantum botany creates plants that exist in multiple states simultaneously, revolutionizing agriculture and medicine. But when her plants begin affecting the fabric of spacetime, she must race to contain what she's unleashed. A blend of hard science fiction and philosophical exploration of humanity's relationship with nature.",
      chapters: [
        { fee: null, id: 1 }, // Free chapter
        { fee: null, id: 2 }, // Free chapter
        { fee: 4.99, id: 3 },
        { fee: 4.99, id: 4 },
        { fee: 5.99, id: 5 },
        { fee: 5.99, id: 6 }
      ]
    },
    {
      id: "book-3",
      title: "Forgotten Horizons",
      author: "James Blackwood",
      description: "An epic historical novel spanning three generations of the Hernandez family, from the Spanish Civil War to modern-day Barcelona. As youngest daughter Lucia uncovers her grandmother's diaries, family secrets emerge that change everything she thought she knew about her heritage and herself.",
      chapters: [
        { fee: null, id: 1 }, // Free chapter
        { fee: 3.49, id: 2 },
        { fee: 3.49, id: 3 },
        { fee: 3.49, id: 4 },
        { fee: 3.49, id: 5 },
        { fee: 3.49, id: 6 },
        { fee: 3.49, id: 7 }
      ]
    },
    {
      id: "book-4",
      title: "Whispers in Code",
      author: "Sophia Chen",
      description: "When programmer Eliza Ward creates an AI to help catalog ancient texts, she doesn't expect it to start decoding a hidden language within them. As the AI reveals messages that predicted historical events with perfect accuracy, Eliza must determine if she's uncovered an ancient communication system or if her creation has developed beyond her understanding.",
      chapters: [
        { fee: 1.99, id: 1 },
        { fee: 1.99, id: 2 },
        { fee: 1.99, id: 3 },
        { fee: 1.99, id: 4 },
        { fee: 1.99, id: 5 }
      ]
    },
    {
      id: "book-5",
      title: "The Art of Impossible Spaces",
      author: "Oliver Nightingale",
      description: "Part architectural theory, part memoir, this groundbreaking work explores how spaces shape human experience. Drawing from his work designing embassies, prisons, and healing centers, Nightingale presents a radical new approach to creating environments that transform how we think, feel, and connect with others.",
      chapters: [
        { fee: null, id: 1 }, // Free chapter
        { fee: 6.99, id: 2 },
        { fee: 6.99, id: 3 },
        { fee: 6.99, id: 4 },
        { fee: 6.99, id: 5 }
      ]
    },
    {
      id: "book-6",
      title: "Wild Minds",
      author: "Leila Abernathy",
      description: "In this revolutionary study of animal cognition, renowned biologist Leila Abernathy presents evidence that challenges everything we thought we knew about non-human intelligence. From tool-creating crows to dolphins with symbolic language, Wild Minds makes the case for a complete reassessment of consciousness throughout the animal kingdom.",
      chapters: [
        { fee: null, id: 1 }, // Free chapter
        { fee: null, id: 2 }, // Free chapter
        { fee: 5.49, id: 3 },
        { fee: 5.49, id: 4 },
        { fee: 5.49, id: 5 },
        { fee: 5.49, id: 6 }
      ]
    }
  ];

  export const mockFSMEvents = [
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000001,
      tags: [
        ["id", "chapter-1"],
        ["title", "Arrival"],
        ["next", "chapter-2"],
        ["prompt", "You wake up on a beach."],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-1>",
      id: "event1",
      sig: "<sig1>"
    },
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000002,
      tags: [
        ["id", "chapter-2"],
        ["title", "Fork in the Road"],
        ["next", "chapter-3", "choice", "Follow the river"],
        ["next", "chapter-4", "choice", "Head into the jungle"],
        ["prompt", "Which path will you take?"],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-2>",
      id: "event2",
      sig: "<sig2>"
    },
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000003,
      tags: [
        ["id", "chapter-3"],
        ["title", "The River’s Edge"],
        ["next", "chapter-5"],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-3>",
      id: "event3",
      sig: "<sig3>"
    },
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000004,
      tags: [
        ["id", "chapter-4"],
        ["title", "Jungle Discovery"],
        ["paywall", "true", "lnurl", "lnurl1dp68gup69uhkcmmrv9mkzcnwvdhk6"],
        ["next", "chapter-6"],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-4>", // encrypted, needs payment
      id: "event4",
      sig: "<sig4>"
    },
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000005,
      tags: [
        ["id", "chapter-5"],
        ["title", "River Crossing"],
        ["paywall", "true", "lnurl", "lnurl1dp68gup69uhkummrv9mkzcnwv3jsc"],
        ["next", "chapter-6"],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-5>", // encrypted, needs payment
      id: "event5",
      sig: "<sig5>"
    },
    {
      kind: 40001,
      pubkey: "author_pubkey_abc",
      created_at: 1680000006,
      tags: [
        ["id", "chapter-6"],
        ["title", "The Hidden Temple"],
        ["paywall", "true", "lnurl", "lnurl1dp68gup69uhk2mmrv9mkzcnwv4exy"],
        ["end", "true"],
        ["prompt", "You’ve found the heart of the island."],
        ["content-type", "text/markdown"]
      ],
      content: "<encrypted-content-6>", // encrypted, final node
      id: "event6",
      sig: "<sig6>"
    }
  ];

  const mockFsmMetadataEvent = {
    kind: 30077,
    pubkey: "author_pubkey_abc",
    created_at: 1680000000,
    tags: [
      ["d", "story-abc"],
      ["title", "The Island of Secrets"],
      ["summary", "An interactive fiction adventure with multiple paths."],
      ["cover", "https://example.com/cover.jpg"],
      ["genre", "interactive-fiction"],
      ["language", "en"],
      ["start", "chapter-1"],
      ["chapters", "6"],
      ["paywalled", "true"],
      ["min-cost", "1500"],
      ["entry-kind", "40001"]
    ],
    content: "Embark on a journey through a mysterious island. Choose your path, unlock secrets, and survive the unknown.",
    id: "fsm-meta-1",
    sig: "<sig-meta>"
  };

  import { v4 as uuidv4 } from 'uuid'; // If needed, or use pre-defined strings

import { State, FsmData } from '@/components/ui/FsmBuilder'; // Assuming types are exported or accessible

// --- Define IDs ---
const BOOK_ID = 'book-adventure-001'; // Example Book ID
const AUTHOR_PUBKEY = 'author-pubkey-123'; // Example Author Pubkey

const CHAPTER_START_ID = 'ch-start-forest';
const CHAPTER_CAVE_ID = 'ch-cave-entrance';
const CHAPTER_RIVER_ID = 'ch-river-crossing';
const CHAPTER_TREASURE_ID = 'ch-treasure-room'; // Paid choice target
const CHAPTER_TRAP_ID = 'ch-trap-pit'; // Free choice target
const CHAPTER_END_GOOD_ID = 'ch-end-escape'; // End state
const CHAPTER_END_BAD_ID = 'ch-end-trapped'; // End state

const TRANS_START_TO_CAVE = 'tr-start-cave';
const TRANS_START_TO_RIVER = 'tr-start-river';
const TRANS_CAVE_TO_TREASURE = 'tr-cave-treasure';
const TRANS_CAVE_TO_TRAP = 'tr-cave-trap';
const TRANS_RIVER_TO_END = 'tr-river-escape';
const TRANS_TRAP_TO_END = 'tr-trap-end';
const TRANS_TREASURE_TO_END = 'tr-treasure-escape';


// --- Define States (Chapters) ---
const states: Record<string, State> = {
    [CHAPTER_START_ID]: {
        id: CHAPTER_START_ID,
        name: 'Chapter 1: Whispering Woods',
        content: 'You find yourself lost in a dense forest. Sunlight barely pierces the thick canopy above. Before you, the path splits. To the left, you see the dark mouth of a cave. To the right, you hear the sound of rushing water.',
        isStartState: true,
        isEndState: false,
        entryFee: 0, // Free to start
        transitions: [
            {
                id: TRANS_START_TO_CAVE,
                choiceText: 'Enter the cave.',
                targetStateId: CHAPTER_CAVE_ID,
                price: 0, // Free choice
            },
            {
                id: TRANS_START_TO_RIVER,
                choiceText: 'Head towards the river.',
                targetStateId: CHAPTER_RIVER_ID,
                price: 0, // Free choice
            },
        ],
    },
    [CHAPTER_CAVE_ID]: {
        id: CHAPTER_CAVE_ID,
        name: 'Chapter 2: The Cave Mouth',
        content: 'The air in the cave is cold and damp. Moss clings to the walls. You see two tunnels ahead. One seems to glitter faintly in the distance, but costs a small fee to explore. The other descends into darkness.',
        isStartState: false,
        isEndState: false,
        entryFee: 100, // Cost 100 sats to enter this chapter
        transitions: [
            {
                id: TRANS_CAVE_TO_TREASURE,
                choiceText: 'Investigate the glittering tunnel (Cost: 500 sats).',
                targetStateId: CHAPTER_TREASURE_ID,
                price: 500, // Paid choice
            },
            {
                id: TRANS_CAVE_TO_TRAP,
                choiceText: 'Descend into darkness.',
                targetStateId: CHAPTER_TRAP_ID,
                price: 0, // Free choice
            },
        ],
    },
    [CHAPTER_RIVER_ID]: {
        id: CHAPTER_RIVER_ID,
        name: 'Chapter 2: Rushing River',
        content: 'You reach a wide, fast-flowing river. A rickety rope bridge spans the chasm. It looks perilous, but it\'s the only way across you can see.',
        isStartState: false,
        isEndState: false,
        entryFee: 0, // Free chapter
        transitions: [
            {
                id: TRANS_RIVER_TO_END,
                choiceText: 'Attempt to cross the bridge.',
                targetStateId: CHAPTER_END_GOOD_ID, // Leads directly to a good end
                price: 0,
            },
        ],
    },
    [CHAPTER_TREASURE_ID]: {
        id: CHAPTER_TREASURE_ID,
        name: 'Chapter 3: Treasure Room',
        content: 'Your gamble paid off! The tunnel opens into a small chamber filled with ancient coins and sparkling gems. You gather as much as you can carry. A hidden passage offers a way out.',
        isStartState: false,
        isEndState: false, // Not an end state itself, must choose exit
        entryFee: 0, // Fee was paid on the *choice* leading here
        transitions: [
            {
                id: TRANS_TREASURE_TO_END,
                choiceText: 'Take the hidden passage.',
                targetStateId: CHAPTER_END_GOOD_ID,
                price: 0,
            }
        ],
    },
    [CHAPTER_TRAP_ID]: {
        id: CHAPTER_TRAP_ID,
        name: 'Chapter 3: The Pitfall',
        content: 'You take a few steps into the darkness when the floor gives way beneath you! You tumble down into a deep pit. Luckily, you land on a pile of soft leaves, unharmed but stuck.',
        isStartState: false,
        isEndState: false, // Not an end state itself
        entryFee: 0,
        transitions: [
             {
                id: TRANS_TRAP_TO_END,
                choiceText: 'Wait for rescue (or doom).',
                targetStateId: CHAPTER_END_BAD_ID,
                price: 0,
            }
        ],
    },
    [CHAPTER_END_GOOD_ID]: {
        id: CHAPTER_END_GOOD_ID,
        name: 'Ending: Freedom!',
        content: 'You emerge into the bright sunlight, safe and sound (and perhaps a little richer!). Your adventure concludes successfully. THE END.',
        isStartState: false,
        isEndState: true, // This is an end state
        entryFee: 0,
        transitions: [], // No transitions from an end state
    },
     [CHAPTER_END_BAD_ID]: {
        id: CHAPTER_END_BAD_ID,
        name: 'Ending: Trapped!',
        content: 'Days turn into nights, and no one comes. You are trapped in the pit with only leaves for company. Your adventure ends here. THE END.',
        isStartState: false,
        isEndState: true, // This is an end state
        entryFee: 0,
        transitions: [],
    },
};

// --- Assemble FsmData ---
export const mockFsmData: FsmData = {
    states: states,
    startStateId: CHAPTER_START_ID,
};

// Also export bookId and authorPubkey if needed by the parent component easily
export const mockBookId = BOOK_ID;
export const mockAuthorPubkey = AUTHOR_PUBKEY;
  
  