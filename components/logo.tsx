import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/site-path";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <Image
        src={withBasePath("/logo.png")}
        alt="Habit Tracker logo"
        width={36}
        height={36}
        className="size-9 rounded-full object-cover"
        priority
      />
      <span className="text-sm font-semibold tracking-[0.18em] text-foreground uppercase">
        Habit Tracker
      </span>
    </Link>
  );
}
