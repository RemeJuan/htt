import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your listings and account.",
};

export default function DashboardPage() {
  return (
    <section className="space-y-6 py-6 sm:py-8 lg:py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Dashboard features are static in export mode. Browse public listings instead.
      </p>

      <Link href="/listings" className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">
        View public listings
      </Link>
    </section>
  );
}
