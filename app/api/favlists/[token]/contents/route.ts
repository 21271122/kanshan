import { NextResponse } from "next/server";
export async function GET(request: Request, { params }: { params: { token: string } }) {
  const secret = process.env.ZHIHU_ACCESS_SECRET, raw = request.headers.get("cookie")?.match(/(?:^|; )kanshan_session=([^;]+)/)?.[1];
  if (!secret || !raw) return NextResponse.json({ error: "需要登录。" }, { status: 401 });
  try {
    const session = JSON.parse(Buffer.from(decodeURIComponent(raw), "base64url").toString()) as { token?: string };
    if (!session.token || !/^\d+$/.test(params.token)) return NextResponse.json({ error: "请求参数无效。" }, { status: 400 });
    const upstream = await fetch("https://developer.zhihu.com/api/v1/user/favlist_contents?FavlistUrlToken=" + params.token + "&Limit=50", { headers: { Authorization: "Bearer " + secret, "X-OAuth-Token": session.token, "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)), "Content-Type": "application/json" }, cache: "no-store" });
    const body = await upstream.json();
    if (!upstream.ok || body.Code !== 0) return NextResponse.json({ error: "收藏内容读取失败。" }, { status: upstream.status || 502 });
    return NextResponse.json({ items: (body.Data?.Items ?? []).map((x: any) => ({ id: x.Url, url: x.Url, title: x.Title || "未命名收藏", hint: x.Summary || "一段被你认真留下的内容", tags: [], type: x.ContentType === "article" ? "文章" : "回答", favlist: x.Favlist?.Title || "我的收藏" })) });
  } catch { return NextResponse.json({ error: "知乎收藏内容响应异常。" }, { status: 502 }); }
}

