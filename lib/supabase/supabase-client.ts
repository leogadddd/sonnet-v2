import { supabaseConfig } from "./config";
import { createBrowserClient } from "@supabase/ssr";

export const getSupabase = () => {
  const { url, key } = supabaseConfig();
  return createBrowserClient(url, key);
};
