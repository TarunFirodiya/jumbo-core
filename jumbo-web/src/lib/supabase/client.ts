import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in browser/client components
 * Use this in React components with 'use client' directive
 *
 * Falls back to Vercel Integration keys (SUPABASE_URL / SUPABASE_ANON_KEY)
 * and returns a mock client during build if all keys are missing.
 */
export function createClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === "undefined") {
      // Build/SSG context — return a mock client so the build can finish
      return createMockClient();
    }
    throw new Error(
      "Missing Supabase environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

/** Minimal mock that satisfies call-sites without hitting the network. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockClient(): any {
  const noopQuery = () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    eq: () => ({ data: [], error: null }),
    single: () => ({ data: null, error: null }),
  });

  return {
    from: noopQuery,
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: null }, error: null }),
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
  };
}
