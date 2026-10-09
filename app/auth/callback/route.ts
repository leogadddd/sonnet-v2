import { NextResponse } from "next/server";

import { safeRedirect } from "@/lib/auth/redirect";
import { getSupabase } from "@/lib/supabase/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const db = await getSupabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeRedirect(url.searchParams.get("next")), url.origin),
      );
  }
  return NextResponse.redirect(new URL("/auth/error", url.origin));
}
