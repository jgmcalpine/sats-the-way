'use client';

import Bookshelf from '@/components/ui/BookShelf';
import { mockBooks } from '@/constants/mock';

export default function Home() {
  return (
    <div className="py-8 px-2">
      <h1 className="text-3xl font-bold text-center mb-8">My Library</h1>
      <Bookshelf 
        books={mockBooks} 
      />
    </div>
  );
}
