import { ContentItem, Crop, FarmState, Workspace, emptyFarm, DEMO_DURATION, PLOT_COUNT, seasonForDate, type Season } from "./model";
import { demoItems, isContentUrl, parseCollectionImport } from "./catalog";
export const STORAGE_KEY = "kanshan-demo";
export const PERSONAL_KEY_PREFIX = "kanshan-personal-";
export const FAVORITES_KEY_PREFIX = "kanshan-favorites-";
export type FavoriteCache = { userId: string; syncedAt: number; folders: Array<{ token: string; title: string; count: number | null }>; items: ContentItem[] };
export function safeUserKey(userId: string) { return encodeURIComponent(userId).replace(/%/g, "_"); }
export function personalStorageKey(userId: string) { return PERSONAL_KEY_PREFIX + safeUserKey(userId); }
export function favoritesStorageKey(userId: string) { return FAVORITES_KEY_PREFIX + safeUserKey(userId); }
export const LEGACY_KEY = "kanshan-woye-demo-v1";
export function initialWorkspace(): Workspace { const season = seasonForDate(); return { version: 2, mode: "demo", demo: emptyFarm(demoItems), personal: emptyFarm([]), personalItems: [], favoriteFolders: [], favoritePool: [], consumedUrls: [], seasonMode: "auto", season, welcomeSeason: season }; }
export function initialPersonalWorkspace(items: ContentItem[] = []): Workspace { const w = initialWorkspace(); return { ...w, mode: "personal", personalItems: items, favoritePool: items, personal: emptyFarm(items) }; }
const record = (x: unknown): Record<string, unknown> => x !== null && typeof x === "object" ? x as Record<string, unknown> : {};
const finite = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
function restoreFarm(value: unknown, items: ContentItem[], allowUnknown = false): FarmState {
  const raw = record(value), blank = emptyFarm(items), ids = new Set(items.map(i => i.id));
  const strings = (x: unknown): string[] => Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
  const sources = strings(raw.sources).filter(s => blank.sources.includes(s));
  const reviewed = [...new Set(strings(raw.reviewed).filter(id => ids.has(id)))];
  const plots = new Set<number>(), occupied = new Set<string>();
  const crops: Crop[] = [];
  for (const v of Array.isArray(raw.crops) ? raw.crops : []) {
    const c = record(v);
    if (typeof c.id !== "string" || typeof c.itemId !== "string" || (!allowUnknown && !ids.has(c.itemId)) || reviewed.includes(c.itemId) || !finite(c.plot) || !Number.isInteger(c.plot) || c.plot < 0 || c.plot >= PLOT_COUNT || plots.has(c.plot) || occupied.has(c.itemId) || !finite(c.plantedAt)) continue;
    plots.add(c.plot); occupied.add(c.itemId);
    const durationMs = finite(c.durationMs) && c.durationMs >= 1000 && c.durationMs <= 604800000 ? c.durationMs : DEMO_DURATION;
    const careSeconds = finite(c.careSeconds) ? Math.max(0, Math.min(c.careSeconds, durationMs / 1000)) : 0;
    crops.push({ id: c.id, itemId: c.itemId, plot: c.plot, zoneId: "main-field", plantedAt: c.plantedAt, durationMs, careSeconds, caredAt: finite(c.caredAt) ? c.caredAt : careSeconds > 0 ? c.plantedAt : undefined, assetFamily: typeof c.assetFamily === "string" ? c.assetFamily : "default" });
  }
  const log: FarmState["log"] = [];
  const logIds = new Set<string>();
  for (const v of Array.isArray(raw.log) ? raw.log : []) {
    const entry = record(v), item = record(entry.item);
    const found = items.find(i => i.id === item.id) ?? (typeof item.id === "string" && typeof item.url === "string" && typeof item.title === "string" ? item as unknown as ContentItem : undefined);
    if (!found || typeof entry.id !== "string" || logIds.has(entry.id) || !(entry.at === null || finite(entry.at))) continue;
    logIds.add(entry.id);
    log.push({ id: entry.id, item: found, at: entry.at, round: finite(entry.round) ? entry.round : 1, assetFamily: typeof entry.assetFamily === "string" ? entry.assetFamily : undefined });
  }
  // V1 did not record dates. Preserve progress without inventing timestamps.
  if (!Array.isArray(raw.log)) reviewed.forEach(id => { const item = items.find(i => i.id === id)!; log.push({ id: "legacy-" + id, item, at: null, round: 1 }); });
  const plantedCount = finite(raw.plantedCount) && raw.plantedCount >= 0 ? Math.floor(raw.plantedCount) : crops.length + log.length;
  return { ...blank, achievements: strings(raw.achievements).filter(key => ["first", "ten", ...(raw.log ? ["caretaker"] : [])].includes(key) || key.startsWith("memorial:")), entered: raw.entered === true, sources: sources.length ? sources : blank.sources, crops, reviewed, log, round: finite(raw.round) && raw.round >= 1 ? Math.floor(raw.round) : 1, gardenSince: crops.length ? finite(raw.gardenSince) ? raw.gardenSince : Math.min(...crops.map(c => c.plantedAt)) : null, plantedCount, starterFamily: typeof raw.starterFamily === "string" ? raw.starterFamily : crops.find(c => c.assetFamily)?.assetFamily };
}
export function restoreWorkspace(text: string): Workspace {
  const raw = record(JSON.parse(text));
  if (raw.version !== 2) throw new Error("Unsupported save version");
  let personalItems: ContentItem[] = [];
  if (Array.isArray(raw.personalItems) && raw.personalItems.length) { try { personalItems = parseCollectionImport(JSON.stringify(raw.personalItems)); } catch { personalItems = []; } }
  const folders = Array.isArray(raw.favoriteFolders) ? raw.favoriteFolders.filter((x: any) => x && typeof x.token === "string" && typeof x.title === "string").map((x: any) => ({ token: x.token, title: x.title, total: finite(x.total) ? x.total : 0, urls: Array.isArray(x.urls) ? x.urls.filter((u: any) => typeof u === "string") : [], fetchedAt: finite(x.fetchedAt) ? x.fetchedAt : 0 })) : [];
  const consumedUrls = Array.isArray(raw.consumedUrls) ? raw.consumedUrls.filter((u: any) => typeof u === "string") : [];
  const fallbackSeason = seasonForDate(); const season = raw.season === "spring" || raw.season === "autumn" ? raw.season as Season : fallbackSeason; const seasonMode = raw.seasonMode === "manual" ? "manual" as const : "auto" as const; return { version: 2, mode: raw.mode === "personal" ? "personal" : "demo", personalItems, favoriteFolders: folders, favoritePool: Array.isArray(raw.favoritePool) ? raw.favoritePool as ContentItem[] : personalItems, consumedUrls, seasonMode, season, welcomeSeason: raw.welcomeSeason === "spring" || raw.welcomeSeason === "autumn" ? raw.welcomeSeason as Season : season, demo: restoreFarm(raw.demo, demoItems), personal: restoreFarm(raw.personal, personalItems, true) };
}
export function restorePersonalWorkspace(text: string, items: ContentItem[] = []): Workspace {
  const restored = restoreWorkspace(text);
  const all = [...items, ...restored.personalItems];
  let merged: ContentItem[] = [];
  if (all.length) { try { merged = parseCollectionImport(JSON.stringify(all.slice(0, 2000))); } catch { merged = restored.personalItems; } }
  const farmItems = merged.length ? merged : (restored.favoritePool.length ? restored.favoritePool : items);
  return { ...restored, mode: "personal", personalItems: merged.length ? merged : farmItems, favoritePool: restored.favoritePool.length ? restored.favoritePool : farmItems, personal: restoreFarm(restored.personal, farmItems, true) };
}
export function migrateLegacy(text: string): Workspace {
  const next = initialWorkspace(); next.demo = restoreFarm(JSON.parse(text), demoItems); return next;
}
export function validDestination(item: ContentItem, mode: "demo" | "personal") {
  return mode === "demo" ? demoItems.some(i => i.id === item.id && i.url === item.url) : isContentUrl(item.url);
}

