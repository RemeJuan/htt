import { ListingForm } from "@/components/listings/listing-form";
import { createListingAction } from "../actions";

export default function NewListingPage() {
  return (
    <section className="space-y-6 py-10 md:py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">New listing</h1>
      </div>

      <ListingForm action={createListingAction} submitLabel="Create listing" />
    </section>
  );
}
