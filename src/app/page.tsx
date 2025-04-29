'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import BookGrid from '@/components/ui/BookGrid';

export default function Home() {
  const router = useRouter();

  const handleReadBook = (bookId: string, authorPubkey: string) => {
    const readUrl = `/read/${authorPubkey}/${bookId}`;
    router.push(readUrl)
  }

  return (
    <div className="py-8 px-2">
      <h1 className="text-3xl font-bold text-center mb-8">NostrBooks</h1>
      <BookGrid onSelectBook={(bookId, authorPubkey) => handleReadBook(bookId, authorPubkey)} />
    </div>
  );
}
