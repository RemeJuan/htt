import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function ListingNotFound() {
  return (
    <section className="py-10 md:py-16">
      <EmptyState
        title="Listing not found"
        description="This public listing does not exist or is not published."
        action={
          <Link href="/listings" className="text-sm font-medium underline underline-offset-4">
            Back to listings
          </Link>
        }
      />
    </section>
  );
}
