"use client";

import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

/**
 * Hook to access the Supabase client in client components
 */
export function useSupabase() {
  const supabase = useMemo(() => createClient(), []);
  return supabase;
}

