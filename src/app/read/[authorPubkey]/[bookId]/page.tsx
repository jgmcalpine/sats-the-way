"use client";
import React, { useEffect } from "react";
import { useParams } from 'next/navigation'
import { CircularProgress, Typography } from "@mui/material";

import NostrBookReader from "@/components/ui/NostrBookReader";

import { useNostrBookReader } from "@/hooks/useNostrBookReader";
import { Transition } from "@/hooks/useFsm";

export default function BookReaderPage() {
  const params = useParams();
  const { authorPubkey, bookId } = params as {
    authorPubkey: string
    bookId: string
  }

  const {
		isLoading,
		error,
		bookMetadata,
    currentChapter,
		fetchBookData,
    goToChapterByChoice,
    setCurrentChapterById
	} = useNostrBookReader();

  useEffect(() => {
    if (bookId && authorPubkey) {
        fetchBookData({bookId, authorPubkey});
    }
    // Optional: Add cleanup or handle identifier changes if needed
  }, [bookId, fetchBookData, authorPubkey]);

  const handleChapterNav = async (transition: Transition) => {
    goToChapterByChoice(transition.id);
  }

  const handlePreviousChapter = (chapterId: string) => {
    setCurrentChapterById(chapterId);
  }

  if (isLoading || error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <CircularProgress />
        <Typography variant="h6">Loading book…</Typography>
      </div>
    );
  }

  if (currentChapter && bookMetadata) {
    return <NostrBookReader onPreviousChapter={handlePreviousChapter} onTransitionSelect={handleChapterNav} currentChapter={currentChapter} bookMetadata={bookMetadata} />
  }
}
