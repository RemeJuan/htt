import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, vi } from "vitest";

type LinkMockProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
};

function LinkMock({ href, children, ...props }: LinkMockProps) {
  const resolvedHref = typeof href === "string" ? href : href.pathname ?? "";

  return (
    <a href={resolvedHref} {...props}>
      {children as ReactNode}
    </a>
  );
}

vi.mock("next/link", () => ({
  default: LinkMock,
}));

afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup();
  }
});
