"use client";

import { ErrorState } from "@/components/ui/error-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="py-6 sm:py-8 lg:py-10">
      <ErrorState
        title="Something went wrong"
        description={error.message || "Unexpected error."}
        retryLabel="Reload section"
        onRetry={reset}
      />
    </div>
  );
}
