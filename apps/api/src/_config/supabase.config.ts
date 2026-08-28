import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Env } from "./env.config";

// Auth admin and Theme image upload signing only — never a row.
export const SUPABASE = Symbol("SUPABASE");

export const createServiceClient = (env: Env): SupabaseClient =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
