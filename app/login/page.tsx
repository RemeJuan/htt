import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to manage your listings and dashboard.",
};

export default function LoginPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-md flex-col justify-center py-6 sm:py-8 lg:py-10">
      <AuthForm mode="login" />
    </section>
  );
}
