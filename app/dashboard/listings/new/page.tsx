import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New listing",
  description: "Create a new listing in your dashboard.",
};

export default function NewListingPage() {
  return (
    <section className="space-y-6 py-6 sm:py-8 lg:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">New listing</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Creating listings is unavailable in static export mode.
        </p>
        <Link
          href="/listings"
          className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
        >
          View public listings
        </Link>
      </div>
    </section>
  );
}
