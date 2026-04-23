"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasSupabaseEnv } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { label: "Listings", href: "/listings" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Account", href: "/dashboard/account" },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <nav className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Log in
              </Link>
            )}
            {!user ? (
              <Link
                href="/signup"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Sign up
              </Link>
            ) : null}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
