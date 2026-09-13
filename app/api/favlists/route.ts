import { NextResponse } from "next/server";
function cookie(request: Request, name: string) { return request.headers.get("cookie")?.match(new RegExp("(?:^|; )" + name + "=([^;]+)"))?.[1]; }
export async function GET(request: Request) {
  const session = cookie(request, "kanshan_session"), secret = process.env.ZHIHU_ACCESS_SECRET;
  if (!session || !secret) return NextResponse.json({ error: "需要登录知乎并在服务端配置 Access Secret。" }, { status: 401 });
  try {
    const data = JSON.parse(Buffer.from(decodeURIComponent(session), "base64url").toString()) as { token?: string; expiresAt?: number };
    if (!data.token || !data.expiresAt || data.expiresAt < Date.now()) return NextResponse.json({ error: "知乎登录已过期，请重新授权。" }, { status: 401 });
    const upstream = await fetch("https://developer.zhihu.com/api/v1/user/favlists?Limit=50", { headers: { Authorization: "Bearer " + secret, "X-OAuth-Token": data.token, "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)), "Content-Type": "application/json" }, cache: "no-store" });
    const body = await upstream.json();
    if (!upstream.ok || body.Code !== 0) return NextResponse.json({ error: "知乎收藏夹读取失败。", code: body.Code }, { status: upstream.status || 502 });
    const list = body.Data?.Items ?? [];
    const fetchContents = async (x: any) => {
      const base = { token: String(x.UrlToken), title: x.Title, description: x.Description ?? "", isPublic: !!x.IsPublic };
      const all: any[] = [];
      let offset = 0, total = 0;
      for (;;) {
        let json: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const detail = await fetch("https://developer.zhihu.com/api/v1/user/favlist_contents?FavlistUrlToken=" + encodeURIComponent(String(x.UrlToken)) + "&Offset=" + offset + "&Limit=50", { headers: { Authorization: "Bearer " + secret, "X-OAuth-Token": data.token!, "X-Request-Timestamp": String(Math.floor(Date.now() / 1000)), "Content-Type": "application/json" }, cache: "no-store" });
            json = await detail.json();
            if (!detail.ok || json.Code !== 0) throw new Error("upstream");
            break;
          } catch { json = null; if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1000)); }
        }
        if (!json) return { ...base, count: null, contents: all, error: "该收藏夹暂时读取失败，请稍后重试。" };
        const page = json.Data?.Items ?? [], paging = json.Data?.Paging ?? {};
        total = Number(paging.Totals ?? total + page.length);
        all.push(...page);
        if (!page.length || paging.IsEnd || all.length >= Math.min(total || 2000, 2000)) break;
        offset = Number(paging.NextOffset ?? offset + page.length);
        await new Promise(resolve => setTimeout(resolve, 350));
      }
      return { ...base, count: total, contents: all.slice(0, 2000).map((c: any) => ({ id: c.Url, url: c.Url, title: c.Title || "未命名收藏", hint: c.Summary || "一段被你认真留下的内容", tags: [], type: c.ContentType === "article" ? "文章" : c.ContentType === "answer" ? "回答" : c.ContentType === "pin" ? "想法" : "收藏", favlist: x.Title })) };
    };
    const items: any[] = [];
    // 知乎开放平台对收藏夹接口较敏感，严格串行读取，避免并发限流。
    for (const folder of list) {
      items.push(await fetchContents(folder));
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ error: "知乎收藏夹响应异常。" }, { status: 502 }); }
}




