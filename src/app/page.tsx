import React from 'react';

import BookGrid from '@/components/ui/BookGrid';

export default function Home() {
  return (
    <div className="py-8 px-2">
      <h1 className="text-3xl font-bold text-center mb-8">NostrBooks</h1>
      <BookGrid />
    </div>
  );
}
