import { NextResponse } from "next/server";

import { getAccount } from "@/lib/auth/account";

export async function GET() {
  const user = await getAccount();
  return NextResponse.json(user ?? { error: "Sign in to continue." }, {
    status: user ? 200 : 401,
    headers: { "Cache-Control": "private, no-store" },
  });
}
