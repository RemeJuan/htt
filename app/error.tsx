"use client";

import { ErrorState } from "@/components/ui/error-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="py-10 md:py-16">
      <ErrorState
        title="Something went wrong"
        description={error.message || "Unexpected error."}
        retryLabel="Reload section"
        onRetry={reset}
      />
    </div>
  );
}
