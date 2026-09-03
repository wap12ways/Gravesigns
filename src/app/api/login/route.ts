import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Trimmed, because a value pasted into a hosting dashboard very often picks
  // up a trailing space or newline, and "wrong password" is a miserable way to
  // discover that.
  const expected = process.env.APP_PASSWORD?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "APP_PASSWORD is not set on this deployment. Add it in the hosting " +
          "environment variables, then redeploy — variables only take effect " +
          "on a new build.",
      },
      { status: 500 },
    );
  }
  if (!process.env.SESSION_SECRET?.trim()) {
    return NextResponse.json(
      {
        error:
          "SESSION_SECRET is not set on this deployment. Add it alongside " +
          "APP_PASSWORD, then redeploy.",
      },
      { status: 500 },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || password.trim() !== expected) {
    // Deliberately vague, and slow enough to make guessing tedious.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
