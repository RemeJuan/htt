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
  { label: "Listings", href: "/listings", active: true },
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Log in", href: "/login", active: true },
  { label: "Sign up", href: "/signup", active: true },
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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) =>
              item.active ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="rounded-full px-3 py-2 text-sm text-muted-foreground"
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
          {user ? <LogoutButton /> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
