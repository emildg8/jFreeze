declare module "@auth/drizzle-adapter/sqlite" {
  import type { Adapter } from "@auth/core/adapters";

  export function SQLiteDrizzleAdapter(
    client: unknown,
    schema?: unknown,
  ): Adapter;
}
