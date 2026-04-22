import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "History", href: "#", active: false },
  { label: "Settings", href: "#", active: false },
];

export function Navbar() {
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
