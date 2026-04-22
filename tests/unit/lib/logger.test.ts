import { describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  it("routes to console methods and strips empty context", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logger.info("hello", {});
    logger.warn("warn", { id: 1 });
    logger.error("boom");

    expect(info).toHaveBeenCalledWith("hello", undefined);
    expect(warn).toHaveBeenCalledWith("warn", { id: 1 });
    expect(error).toHaveBeenCalledWith("boom", undefined);
  });
});
