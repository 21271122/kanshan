import type { ContentItem } from "./model";
import { demoItems } from "./demo-data";
export { demoItems };
/** Only content permalinks are accepted; never execute or open arbitrary imported URLs. */
export function isContentUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    const zhihuPath = /^\/(question\/\d+\/answer\/\d+|answer\/\d+|pin\/\d+|question\/\d+)\/?$/;
    return u.protocol === "https:" && !u.username && !u.password && !u.port &&
      ((u.hostname === "www.zhihu.com" && zhihuPath.test(u.pathname)) ||
       (u.hostname === "zhuanlan.zhihu.com" && /^\/p\/\d+\/?$/.test(u.pathname)));
  } catch { return false; }
}
export function parseCollectionImport(text: string): ContentItem[] {
  if (text.length > 1_000_000) throw new Error("文件过大，请每次导入 2000 篇以内的收藏元数据。");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("请使用 JSON 数组格式，检查引号和逗号。"); }
  if (!Array.isArray(data) || !data.length || data.length > 2000) throw new Error("请提供包含 1–2000 篇收藏的数组。");
  const seen = new Set<string>();
  return data.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error("第 " + (index + 1) + " 篇收藏格式不正确。");
    const v = raw as Record<string, unknown>;
    if (typeof v.title !== "string" || !v.title.trim() || v.title.length > 200 || !isContentUrl(v.url)) throw new Error("第 " + (index + 1) + " 篇需要标题和有效的知乎内容 HTTPS 原帖链接。");
    const u = new URL(v.url); const url = u.origin + u.pathname.replace(/\/$/, "");
    const item: ContentItem = { id: url, title: v.title.trim(), url, type: u.hostname === "zhuanlan.zhihu.com" ? "文章" : u.pathname.startsWith("/pin/") ? "想法" : "回答", favlist: typeof v.favlist === "string" && v.favlist.trim() ? v.favlist.trim().slice(0, 80) : "我的旧收藏", hint: typeof v.hint === "string" ? v.hint.slice(0, 100) : "一段曾被你认真留下的内容", tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === "string").slice(0, 5).map(t => t.slice(0, 20)) : [] };
    return item;
  }).filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
}
export function mergeCollectionItems(current: ContentItem[], incoming: ContentItem[]) {
  return Array.from(new Map([...current, ...incoming].map(item => [item.id, item])).values());
}



