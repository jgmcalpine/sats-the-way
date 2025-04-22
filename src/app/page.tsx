'use client';

import Bookshelf, { BookData } from '@/components/ui/BookShelf';

const mockBooks: BookData[] = [
  {
    id: "book-1",
    title: "The Silent Echo",
    author: "Elena Michaels",
    description: "In a world where memories can be stored and shared, detective Sarah Cole investigates a series of missing memory fragments that lead to a conspiracy threatening the very fabric of reality. The Silent Echo explores themes of identity, truth, and the consequences of digitizing our most intimate experiences.",
    chapters: [
      { fee: null }, // Free chapter
      { fee: 2.99 },
      { fee: 2.99 },
      { fee: 3.99 },
      { fee: 3.99 }
    ]
  },
  {
    id: "book-2",
    title: "Quantum Gardens",
    author: "Marcus Wei",
    description: "Dr. Amara Singh's breakthrough in quantum botany creates plants that exist in multiple states simultaneously, revolutionizing agriculture and medicine. But when her plants begin affecting the fabric of spacetime, she must race to contain what she's unleashed. A blend of hard science fiction and philosophical exploration of humanity's relationship with nature.",
    chapters: [
      { fee: null }, // Free chapter
      { fee: null }, // Free chapter
      { fee: 4.99 },
      { fee: 4.99 },
      { fee: 5.99 },
      { fee: 5.99 }
    ]
  },
  {
    id: "book-3",
    title: "Forgotten Horizons",
    author: "James Blackwood",
    description: "An epic historical novel spanning three generations of the Hernandez family, from the Spanish Civil War to modern-day Barcelona. As youngest daughter Lucia uncovers her grandmother's diaries, family secrets emerge that change everything she thought she knew about her heritage and herself.",
    chapters: [
      { fee: null }, // Free chapter
      { fee: 3.49 },
      { fee: 3.49 },
      { fee: 3.49 },
      { fee: 3.49 },
      { fee: 3.49 },
      { fee: 3.49 }
    ]
  },
  {
    id: "book-4",
    title: "Whispers in Code",
    author: "Sophia Chen",
    description: "When programmer Eliza Ward creates an AI to help catalog ancient texts, she doesn't expect it to start decoding a hidden language within them. As the AI reveals messages that predicted historical events with perfect accuracy, Eliza must determine if she's uncovered an ancient communication system or if her creation has developed beyond her understanding.",
    chapters: [
      { fee: 1.99 },
      { fee: 1.99 },
      { fee: 1.99 },
      { fee: 1.99 },
      { fee: 1.99 }
    ]
  },
  {
    id: "book-5",
    title: "The Art of Impossible Spaces",
    author: "Oliver Nightingale",
    description: "Part architectural theory, part memoir, this groundbreaking work explores how spaces shape human experience. Drawing from his work designing embassies, prisons, and healing centers, Nightingale presents a radical new approach to creating environments that transform how we think, feel, and connect with others.",
    chapters: [
      { fee: null }, // Free chapter
      { fee: 6.99 },
      { fee: 6.99 },
      { fee: 6.99 },
      { fee: 6.99 }
    ]
  },
  {
    id: "book-6",
    title: "Wild Minds",
    author: "Leila Abernathy",
    description: "In this revolutionary study of animal cognition, renowned biologist Leila Abernathy presents evidence that challenges everything we thought we knew about non-human intelligence. From tool-creating crows to dolphins with symbolic language, Wild Minds makes the case for a complete reassessment of consciousness throughout the animal kingdom.",
    chapters: [
      { fee: null }, // Free chapter
      { fee: null }, // Free chapter
      { fee: 5.49 },
      { fee: 5.49 },
      { fee: 5.49 },
      { fee: 5.49 }
    ]
  }
];

export default function Home() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-center mb-8">My Library</h1>
      <Bookshelf 
        books={mockBooks} 
      />
    </div>
  );
}
