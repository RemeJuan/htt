import type { Metadata } from "next";

import { AccountSettings } from "@/components/account-settings";
import { requireAuthenticatedUser } from "@/lib/auth-user";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your linked identities.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireAuthenticatedUser("/dashboard/account");

  return (
    <section className="py-6 sm:py-8 lg:py-10">
      <AccountSettings email={user.email} />
    </section>
  );
}
