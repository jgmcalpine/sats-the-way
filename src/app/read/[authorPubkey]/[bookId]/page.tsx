"use client";
import React, { useEffect } from "react";
import { useParams } from 'next/navigation'

import { CircularProgress, Typography } from "@mui/material";

import { useNostrBookReader } from "@/hooks/useNostrBookReader";

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
    currentChapter, // Derived from currentChapterId and chapters
		fetchBookData,
	} = useNostrBookReader();

  useEffect(() => {
    if (bookId && authorPubkey) {
        fetchBookData({bookId, authorPubkey});
    }
    // Optional: Add cleanup or handle identifier changes if needed
}, [bookId, fetchBookData]);

  if (isLoading || error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <CircularProgress />
        <Typography variant="h6">Loading book…</Typography>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <Typography variant="h4" className="mb-1">
        {bookMetadata?.title}
      </Typography>
      {bookMetadata?.description && (
        <Typography
          variant="subtitle1"
          className="mb-6 text-gray-500 dark:text-gray-400"
        >
          {bookMetadata.description}
        </Typography>
      )}

      {/* Chapter title */}
      <Typography variant="h5" className="mb-4">
        {currentChapter?.name}
      </Typography>

      {/* Chapter content */}
      <Typography
        variant="body1"
        className="prose mb-12 whitespace-pre-wrap"
      >
        {currentChapter?.content}
      </Typography>

      {/* Navigation controls */}
      <div className="flex justify-between">
        {}
        {/* <Button
          variant="outlined"
          disabled={canPrev}
          onClick={reader.goPrev}
        >
          ← Back
        </Button>
        <Button
          variant="contained"
          disabled={!reader.canNext}
          onClick={reader.goNext}
        >
          Next →
        </Button> */}
      </div>
    </div>
  );
}
