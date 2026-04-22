import { redirect } from "next/navigation";

import { ListingForm } from "@/components/listings/listing-form";
import { getOwnListingById } from "@/lib/listings";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { updateListingAction } from "../../actions";

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

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  const listing = await getOwnListingById(userId, id);

  if (!listing) {
    redirect("/dashboard/listings");
  }

  return (
    <section className="space-y-6 py-10 md:py-16">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit listing</h1>
      </div>

      <ListingForm action={updateListingAction.bind(null, listing.id)} listing={listing} submitLabel="Save changes" />
    </section>
  );
}
