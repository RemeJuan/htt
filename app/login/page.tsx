import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col justify-center py-10">
      <AuthForm mode="login" />
      <p className="mt-4 text-sm text-muted-foreground">
        No account? <Link href="/signup">Sign up</Link>
      </p>
    </section>
  );
}
