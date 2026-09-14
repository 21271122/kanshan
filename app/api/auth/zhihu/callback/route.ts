import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url), returnedState = url.searchParams.get("state"), code = url.searchParams.get("authorization_code") ?? url.searchParams.get("code"), providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const stateCookie = request.headers.get("cookie")?.match(/(?:^|; )kanshan_oauth_state=([^;]+)/)?.[1];
  if (providerError) return NextResponse.redirect(new URL("/?auth=error&reason=" + encodeURIComponent("知乎未完成授权：" + providerError), request.url));
  if (!returnedState || !stateCookie || returnedState !== decodeURIComponent(stateCookie)) return NextResponse.json({ error: "知乎登录请求已失效，请重新发起登录。" }, { status: 400 });
  if (!code) return NextResponse.json({ error: "知乎没有返回授权码，登录未完成。" }, { status: 400 });
  if (!process.env.ZHIHU_OAUTH_APP_ID || !process.env.ZHIHU_OAUTH_APP_KEY || !process.env.ZHIHU_OAUTH_REDIRECT_URI) return NextResponse.json({ error: "服务端 OAuth 配置不完整。" }, { status: 503 });
  const tokenResponse = await fetch("https://openapi.zhihu.com/access_token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ app_id: process.env.ZHIHU_OAUTH_APP_ID, app_key: process.env.ZHIHU_OAUTH_APP_KEY, grant_type: "authorization_code", redirect_uri: process.env.ZHIHU_OAUTH_REDIRECT_URI, code }) });
  if (!tokenResponse.ok) { console.error("Zhihu token exchange failed", tokenResponse.status); return NextResponse.redirect(new URL("/?auth=error&reason=" + encodeURIComponent("知乎授权码交换失败（HTTP " + tokenResponse.status + "）。请检查回调地址是否完全一致。"), request.url)); }
  const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) return NextResponse.json({ error: "知乎没有返回可用的访问令牌。" }, { status: 502 });
  const userResponse = await fetch("https://openapi.zhihu.com/user", { headers: { Authorization: "Bearer " + token.access_token } });
  if (!userResponse.ok) { console.error("Zhihu user request failed", userResponse.status); return NextResponse.redirect(new URL("/?auth=error&reason=" + encodeURIComponent("知乎账号信息读取失败（HTTP " + userResponse.status + "）。"), request.url)); }
  const user = await userResponse.json() as Record<string, unknown>;
  const nested = (user.data && typeof user.data === "object" ? user.data : {}) as Record<string, unknown>;
  const userId = String(user.id ?? user.url_token ?? user.uid ?? nested.id ?? nested.url_token ?? nested.uid ?? (token.access_token ? "token-" + token.access_token.slice(0, 24) : ""));
  const session = Buffer.from(JSON.stringify({ sessionId: crypto.randomUUID(), token: token.access_token, expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000, user: { id: userId, name: user.name ?? user.nickname ?? nested.name ?? nested.nickname ?? "知乎用户", avatar: user.avatar_url ?? nested.avatar_url ?? "" } })).toString("base64url");
  const response = NextResponse.redirect(new URL("/?auth=success", request.url));
  response.cookies.set("kanshan_session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  response.cookies.set("kanshan_oauth_state", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}

