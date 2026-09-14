import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const appId = process.env.ZHIHU_OAUTH_APP_ID, redirectUri = process.env.ZHIHU_OAUTH_REDIRECT_URI;
  if (!appId || !process.env.ZHIHU_OAUTH_APP_KEY || !redirectUri) {
    return NextResponse.json({ error: "知乎登录尚未配置完整。需要服务端配置 ZHIHU_OAUTH_APP_ID、ZHIHU_OAUTH_APP_KEY、ZHIHU_OAUTH_REDIRECT_URI；Access Secret 不能替代 OAuth 应用凭证。" }, { status: 503 });
  }
  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(new URL("https://openapi.zhihu.com/authorize?" + new URLSearchParams({
    redirect_uri: redirectUri, app_id: appId, response_type: "code", prompt: "login", state,
  }).toString()));
  response.cookies.set("kanshan_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  response.cookies.set("kanshan_oauth_return", new URL(request.url).searchParams.get("returnTo") === "personal" ? "personal" : "demo", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}

