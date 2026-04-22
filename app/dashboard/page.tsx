import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <section className="space-y-8 py-10 md:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Daily habits will live here.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Placeholder route only. Layout, theme, empty states, and shell ready for next phase.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          title="No habits created"
          description="Habit lists, streaks, and check-ins can plug into this shell once data modeling starts."
        />
        <ErrorState
          title="Error state"
          description="Reusable error component for failed fetches, actions, or route errors."
          retryLabel="Try again"
        />
      </div>
    </section>
  );
}
