import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your password to regain access to your account.",
};

export default function ResetPasswordPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-md flex-col justify-center py-6 sm:py-8 lg:py-10">
      <AuthForm mode="reset-password" />
    </section>
  );
}
