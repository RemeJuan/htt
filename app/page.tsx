import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description: "A directory of habit tracking apps. Add, browse, and compare them.",
};

export default function Home() {
  return (
    <section className="space-y-12 py-6 sm:py-8 lg:py-10">
      <div className="max-w-3xl space-y-6">
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Track the habit trackers.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            A directory of habit tracking apps. Add, browse, and compare them. Yes, it&apos;s dumb.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Browse trackers
          </Link>
          <Link
            href="/listings"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition hover:bg-accent"
          >
            Add a tracker
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">What this is</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>A public list of habit tracker apps.</li>
            <li>Community-submitted listings.</li>
            <li>Basic metadata, no deep analytics.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Why this exists</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Too many habit trackers.</li>
            <li>So now we track them.</li>
            <li>That&apos;s it.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
