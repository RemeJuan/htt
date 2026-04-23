import type { Metadata } from "next";
import Link from "next/link";

import { requireAuthenticatedUser } from "@/lib/auth-user";
import { getOwnListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your listings and account.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser("/dashboard");
  const listings = await getOwnListings(user.id).catch(() => []);

  return (
    <section className="space-y-6 py-6 sm:py-8 lg:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Signed in as {user.email ?? "your account"}. Manage your private listings here.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Owned listings</p>
          <p className="text-3xl font-semibold tracking-tight">{listings.length}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Draft and published listings backed by Supabase.
          </p>
        </article>

        <article className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/listings/new"
              className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Add tracker
            </Link>
            <Link
              href="/dashboard/listings"
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Manage listings
            </Link>
            <Link
              href="/dashboard/account"
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Account settings
            </Link>
            <Link
              href="/listings"
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              View public listings
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
