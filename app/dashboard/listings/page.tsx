import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard listings",
  description: "Manage your owned listings.",
};

export default function ListingsPage() {
  return (
    <section className="space-y-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        </div>
        <Link href="/listings" className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90">
          Browse public listings
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Static export mode disables dashboard management actions.</p>
      </div>
    </section>
  );
}
