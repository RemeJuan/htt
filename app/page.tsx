import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description: "Habit Tracker Tracker — a habit tracker for tracking your habit trackers.",
};

export default function Home() {
  return (
    <section className="space-y-12 py-6 sm:space-y-14 sm:py-8 lg:space-y-16 lg:py-10">
      <div className="max-w-3xl space-y-7 sm:space-y-8">
        <div className="space-y-5 sm:space-y-6">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Habit Tracker Tracker
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            <span className="block">
              Thanks to vibe coding, everyone and their grandmother now has a &apos;better&apos;
              habit tracker.
            </span>{" "}
            <span className="mt-3 block sm:mt-4">So how do you keep track of them all?</span>{" "}
            <span className="mt-3 block sm:mt-4">
              Introducing Habit Tracker Tracker -- a habit tracker for tracking your habit trackers.
            </span>
          </p>
          <p className="text-sm font-medium text-muted-foreground sm:text-base">
            100% vibe coded. Probably secure.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 sm:w-auto"
          >
            Browse trackers
          </Link>
          <Link
            href="/listings"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-medium transition hover:bg-accent sm:w-auto"
          >
            Add a tracker
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">What this is</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>A public list of habit tracker apps.</li>
            <li>Community-submitted, lightly judged.</li>
            <li>Basic metadata. No dashboard therapy.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold">Why this exists</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Too many habit trackers.</li>
            <li>So now we track them.</li>
            <li>That&apos;s the bit.</li>
          </ul>
        </section>
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Built for tracker tracker era.</p>
        <a
          href="https://github.com/RemeJuan/htt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 font-medium text-foreground transition hover:opacity-80"
          aria-label="View Habit Tracker Tracker repository on GitHub"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.48 2 12.02c0 4.42 2.865 8.166 6.839 9.49.5.092.683-.217.683-.483 0-.237-.009-.867-.014-1.703-2.782.604-3.37-1.343-3.37-1.343-.454-1.158-1.11-1.467-1.11-1.467-.907-.62.069-.608.069-.608 1.003.071 1.532 1.03 1.532 1.03.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.22-.254-4.555-1.113-4.555-4.952 0-1.094.39-1.988 1.029-2.688-.104-.255-.446-1.279.098-2.665 0 0 .84-.27 2.75 1.026a9.49 9.49 0 0 1 2.504-.338c.85.004 1.706.115 2.505.338 1.909-1.296 2.748-1.026 2.748-1.026.545 1.386.203 2.41.1 2.665.64.7 1.028 1.594 1.028 2.688 0 3.849-2.339 4.696-4.566 4.945.36.31.678.917.678 1.848 0 1.334-.012 2.41-.012 2.737 0 .268.18.579.688.48A10.03 10.03 0 0 0 22 12.02C22 6.48 17.523 2 12 2Z" />
          </svg>
          View source on GitHub
        </a>
      </footer>
    </section>
  );
}
