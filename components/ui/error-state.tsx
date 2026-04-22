"use client";

import { StateCard } from "@/components/ui/state-card";

type ErrorStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: ErrorStateProps) {
  return (
    <StateCard
      icon={<span aria-hidden="true">!</span>}
      title={title}
      description={description}
      action={
        retryLabel && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            {retryLabel}
          </button>
        ) : undefined
      }
    />
  );
}
