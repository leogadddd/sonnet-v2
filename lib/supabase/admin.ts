import { supabaseConfig } from "./config";
import { createClient } from "@supabase/supabase-js";
import "server-only";

export function adminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret)
    throw new Error("Server storage credentials are not configured.");
  return createClient(supabaseConfig().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
