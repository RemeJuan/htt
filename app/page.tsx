import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Home",
};

const featureCards = [
  {
    title: "Minimal foundation",
    description: "App Router, TypeScript, Tailwind, ESLint, clean folders.",
  },
  {
    title: "Theme ready",
    description: "Dark and light mode with localStorage persistence and system default.",
  },
  {
    title: "Supabase wired",
    description: "Browser client helper ready for queries once schema work starts.",
  },
];

export default function Home() {
  return (
    <section className="space-y-10 py-10 md:py-16">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
          Habit tracker foundation
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Minimal base for focused habit tracking.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Clean shell first. Business logic, auth, and data models can land next without reworking layout or theme.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Open dashboard
          </Link>
          <div className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm text-muted-foreground">
            Supabase {isSupabaseConfigured ? "configured" : "pending env setup"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          title="No habits yet"
          description="Use this shared state component anywhere list data has not been added yet."
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              View dashboard placeholder
            </Link>
          }
        />
        <LoadingState
          title="Loading state"
          description="Shared loading shell ready for route segments and async widgets."
        />
      </div>
    </section>
  );
}
