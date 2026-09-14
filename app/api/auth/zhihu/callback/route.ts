import { NextResponse } from "next/server";

function applicationBaseUrl(request: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    try { return new URL(configured).origin; } catch { /* Fall through to other sources. */ }
  }
  const callback = process.env.ZHIHU_OAUTH_REDIRECT_URI?.trim();
  if (callback) {
    try { return new URL(callback).origin; } catch { /* Fall through to request headers. */ }
  }
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    try { return new URL(forwardedProto + "://" + forwardedHost).origin; } catch { /* Fall through to request URL. */ }
  }
  return new URL(request.url).origin;
}

function redirectToApp(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, applicationBaseUrl(request)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnedState = url.searchParams.get("state");
  const code = url.searchParams.get("authorization_code") ?? url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  const stateCookie = request.headers.get("cookie")?.match(/(?:^|; )kanshan_oauth_state=([^;]+)/)?.[1];

  if (providerError) {
    return redirectToApp(request, "/?auth=error&reason=" + encodeURIComponent("知乎未完成授权：" + providerError));
  }
  if (!returnedState || !stateCookie || returnedState !== decodeURIComponent(stateCookie)) {
    return NextResponse.json({ error: "知乎登录请求已失效，请重新发起登录。" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "知乎没有返回授权码，登录未完成。" }, { status: 400 });
  }
  if (!process.env.ZHIHU_OAUTH_APP_ID || !process.env.ZHIHU_OAUTH_APP_KEY || !process.env.ZHIHU_OAUTH_REDIRECT_URI) {
    return NextResponse.json({ error: "服务端 OAuth 配置不完整。" }, { status: 503 });
  }

  const tokenResponse = await fetch("https://openapi.zhihu.com/access_token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      app_id: process.env.ZHIHU_OAUTH_APP_ID,
      app_key: process.env.ZHIHU_OAUTH_APP_KEY,
      grant_type: "authorization_code",
      redirect_uri: process.env.ZHIHU_OAUTH_REDIRECT_URI,
      code,
    }),
  });
  if (!tokenResponse.ok) {
    console.error("Zhihu token exchange failed", tokenResponse.status);
    return redirectToApp(request, "/?auth=error&reason=" + encodeURIComponent("知乎授权码交换失败（HTTP " + tokenResponse.status + "）。请检查回调地址是否完全一致。"));
  }

  const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
  if (!token.access_token) {
    return NextResponse.json({ error: "知乎没有返回可用的访问令牌。" }, { status: 502 });
  }

  const userResponse = await fetch("https://openapi.zhihu.com/user", {
    headers: { Authorization: "Bearer " + token.access_token },
  });
  if (!userResponse.ok) {
    console.error("Zhihu user request failed", userResponse.status);
    return redirectToApp(request, "/?auth=error&reason=" + encodeURIComponent("知乎账号信息读取失败（HTTP " + userResponse.status + "）。"));
  }

  const user = await userResponse.json() as Record<string, unknown>;
  const nested = (user.data && typeof user.data === "object" ? user.data : {}) as Record<string, unknown>;
  const userId = String(
    user.id ?? user.url_token ?? user.uid ?? user.hash_id ??
    nested.id ?? nested.url_token ?? nested.uid ?? nested.hash_id ??
    (token.access_token ? "token-" + token.access_token.slice(0, 24) : "")
  );
  const userName = [
    user.fullname, user.name, user.nickname,
    nested.fullname, nested.name, nested.nickname,
  ].find(value => typeof value === "string" && value.trim()) as string | undefined;
  const userAvatar = [
    user.avatar_path, user.avatar_url,
    nested.avatar_path, nested.avatar_url,
  ].find(value => typeof value === "string" && value.trim()) as string | undefined;
  const session = Buffer.from(JSON.stringify({
    sessionId: crypto.randomUUID(),
    token: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    user: {
      id: userId,
      name: userName ?? "知乎用户",
      avatar: userAvatar ?? "",
    },
  })).toString("base64url");

  const response = redirectToApp(request, "/?auth=success");
  response.cookies.set("kanshan_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set("kanshan_oauth_state", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}

