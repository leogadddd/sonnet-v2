import { cookies } from "next/headers";

import { supabaseConfig } from "./config";
import { createServerClient } from "@supabase/ssr";
import "server-only";

export const getSupabase = async () => {
  const cookieStore = await cookies();
  const { url, key } = supabaseConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* Server components cannot write cookies; proxy refreshes them. */
        }
      },
    },
  });
};
