import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col justify-center py-10">
      <AuthForm mode="signup" />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </section>
  );
}
