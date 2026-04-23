import { vi } from "vitest";

type QueryState = {
  select: string | null;
  filters: Array<{ method: string; args: unknown[] }>;
  order: Array<{ column: string; options?: unknown }>;
  limit: number | null;
};

export function createSupabaseQueryMock<T = unknown>(result: {
  data: T | null;
  error: { message: string } | null;
}) {
  const state: QueryState = { select: null, filters: [], order: [], limit: null };
  const chain: Record<string, unknown> = {
    select: vi.fn((value: string) => {
      state.select = value;
      return chain;
    }),
    eq: vi.fn((...args: unknown[]) => {
      state.filters.push({ method: "eq", args });
      return chain;
    }),
    ilike: vi.fn((...args: unknown[]) => {
      state.filters.push({ method: "ilike", args });
      return chain;
    }),
    contains: vi.fn((...args: unknown[]) => {
      state.filters.push({ method: "contains", args });
      return chain;
    }),
    order: vi.fn((column: string, options?: unknown) => {
      state.order.push({ column, options });
      return chain;
    }),
    limit: vi.fn((value: number) => {
      state.limit = value;
      return chain;
    }),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    then: (
      onFulfilled: (value: { data: T | null; error: { message: string } | null }) => unknown,
    ) => Promise.resolve(result).then(onFulfilled),
  };

  return { chain, state };
}

export function createSupabaseClientMock<T = unknown>(
  builders: Record<string, ReturnType<typeof createSupabaseQueryMock<T>>>,
) {
  return {
    from: vi.fn((table: string) => builders[table]?.chain),
  };
}
