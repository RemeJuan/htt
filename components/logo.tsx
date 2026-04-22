import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
        HT
      </span>
      <span className="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
        Habit Tracker
      </span>
    </Link>
  );
}
