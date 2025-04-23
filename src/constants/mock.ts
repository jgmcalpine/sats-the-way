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
  
  