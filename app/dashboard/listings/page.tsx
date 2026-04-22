import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { getOwnListings } from "@/lib/listings";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { deleteListingAction } from "./actions";

async function getUserId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}

export default async function ListingsPage() {
  const userId = await getUserId();
  const listings = await getOwnListings(userId);

  return (
    <section className="space-y-8 py-10 md:py-16">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight">Listings</h1>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
        >
          New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Create your first owned listing to start managing it here."
          action={
            <Link href="/dashboard/listings/new" className="text-sm font-medium underline underline-offset-4">
              Create listing
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {listings.map((listing) => (
            <article key={listing.id} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{listing.name}</h2>
                  <p className="text-sm text-muted-foreground">/{listing.slug}</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {listing.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="text-foreground">Platform:</span> {listing.platform}
                </p>
                <p>
                  <span className="text-foreground">URL:</span>{" "}
                  <a href={listing.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {listing.url}
                  </a>
                </p>
                <p>
                  <span className="text-foreground">Claimed:</span> {listing.is_claimed ? "Yes" : "No"}
                </p>
                {listing.description ? <p className="leading-6">{listing.description}</p> : null}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/listings/${listing.id}/edit`}
                  className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium"
                >
                  Edit
                </Link>
                <form action={deleteListingAction.bind(null, listing.id)}>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-red-500"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
