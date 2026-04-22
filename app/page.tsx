import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home",
  description: "Habit tracker home page.",
};

export default function Home() {
  return (
    <section className="space-y-10 py-6 sm:py-8 lg:py-10">
      <div className="max-w-3xl space-y-5">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Habit Tracker
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
