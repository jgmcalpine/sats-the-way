"use client";

import { CircularProgress, Button, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useBookReader } from "@/hooks/useBookReader";

export default function BookReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const reader = useBookReader(bookId);

  if (reader.loading || !reader.meta) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <CircularProgress />
        <Typography variant="h6">Loading book…</Typography>
      </div>
    );
  }

  const { currentChapter } = reader;

  if (!currentChapter) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Typography variant="h6">No chapters found for this book.</Typography>
        <Button className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <Typography variant="h4" className="mb-1">
        {reader.meta.title}
      </Typography>
      {reader.meta.description && (
        <Typography
          variant="subtitle1"
          className="mb-6 text-gray-500 dark:text-gray-400"
        >
          {reader.meta.description}
        </Typography>
      )}

      {/* Chapter title */}
      <Typography variant="h5" className="mb-4">
        {currentChapter.title}
      </Typography>

      {/* Chapter content */}
      <Typography
        variant="body1"
        className="prose mb-12 whitespace-pre-wrap"
      >
        {currentChapter.content}
      </Typography>

      {/* Navigation controls */}
      <div className="flex justify-between">
        <Button
          variant="outlined"
          disabled={!reader.canPrev}
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
        </Button>
      </div>
    </div>
  );
}
