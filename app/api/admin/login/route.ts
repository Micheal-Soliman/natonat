import { NextResponse } from "next/server";

import { createAdminSession, validateAdminCredentials } from "@/lib/admin-auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LoginBody;
  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (!username || !password || !validateAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const sessionToken = createAdminSession(username);
  if (!sessionToken) {
    return NextResponse.json(
      { error: "Admin session secret is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    sessionToken,
  });
}
