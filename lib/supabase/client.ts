import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Bypass the exclusive Navigator Lock. Every Supabase operation
        // (DB queries, auth calls) acquires this lock internally. When
        // AuthProvider's onAuthStateChange(INITIAL_SESSION) holds it, all
        // concurrent queries timeout after 10s. A no-op lock lets them
        // execute without contention.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => await fn(),
      },
    },
  );
  return client;
}
