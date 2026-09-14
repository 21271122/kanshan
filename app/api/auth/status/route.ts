import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const raw = request.headers.get("cookie")?.match(/(?:^|; )kanshan_session=([^;]+)/)?.[1];
  if (!raw) return NextResponse.json({ authenticated: false });
  try { const data = JSON.parse(Buffer.from(decodeURIComponent(raw), "base64url").toString()); if (!data.expiresAt || data.expiresAt < Date.now()) return NextResponse.json({ authenticated: false }); return NextResponse.json({ authenticated: true, user: data.user, sessionId: data.sessionId ?? "legacy" }); } catch { return NextResponse.json({ authenticated: false }); }
}

