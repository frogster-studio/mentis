import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./env";

// The service client is the API's only database path, so RLS owner-scoping becomes explicit filters.
export const SUPABASE = Symbol("SUPABASE");

export const createServiceClient = (env: Env): SupabaseClient =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
