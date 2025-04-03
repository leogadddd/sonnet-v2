import { NextResponse } from "next/server";

import { useSupabase as UseSupabase } from "@/lib/supabase/supabase-client";

export async function GET() {
  const supabase = UseSupabase();

  // Simple ping to keep Supabase awake
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .limit(1);
  if (error) console.error("Supabase Ping Error:", error);

  return NextResponse.json({ status: "Supabase Pinged!" });
}
