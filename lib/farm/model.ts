export type Stage = "seed" | "sprout" | "mature";
export type Season = "autumn" | "spring";
export type SeasonMode = "auto" | "manual";
export type ContentItem = { id: string; favlist: string; title: string; hint: string; tags: string[]; url: string; type: string };
export type Crop = { id: string; plot: number; zoneId: string; itemId: string; plantedAt: number; durationMs: number; careSeconds: number; caredAt?: number; assetFamily?: string };
export type HarvestEntry = { id: string; item: ContentItem; at: number | null; round: number; assetFamily?: string };
export type FarmState = { entered: boolean; achievements: string[]; sources: string[]; crops: Crop[]; reviewed: string[]; log: HarvestEntry[]; round: number; gardenSince: number | null; plantedCount: number; starterFamily?: string };
export type Mode = "demo" | "personal";
export type FavoritePoolEntry = { id: string; url: string; title: string; favlist: string; type: string; hint: string; tags: string[] };
export type FavoriteFolder = { token: string; title: string; total: number; urls: string[]; fetchedAt: number };
export type Workspace = { version: 2; mode: Mode; demo: FarmState; personal: FarmState; personalItems: ContentItem[]; favoriteFolders: FavoriteFolder[]; favoritePool: FavoritePoolEntry[]; consumedUrls: string[]; seasonMode: SeasonMode; season: Season; welcomeSeason: Season };
export type FarmEvent = { type: "PLANT" | "CARE" | "MATURE" | "HARVEST" | "UPROOT"; plot: number; at: number };
export const PLOT_COUNT = 10;
export const DEMO_DURATION = 80_000;
export function emptyFarm(items: ContentItem[]): FarmState {
  return { entered: false, achievements: [], sources: [...new Set(items.map(i => i.favlist))], crops: [], reviewed: [], log: [], round: 1, gardenSince: null, plantedCount: 0 };
}
export function stageOf(crop: Crop, now: number): Stage {
  const progress = growthOf(crop, now);
  return progress >= 1 ? "mature" : progress >= .42 ? "sprout" : "seed";
}
export function growthOf(crop: Crop, now: number) {
  return Math.min(1, Math.max(0, (now - crop.plantedAt + crop.careSeconds * 1000) / crop.durationMs));
}
export function remainingMs(crop: Crop, now: number) { return Math.max(0, crop.durationMs - (now - crop.plantedAt) - crop.careSeconds * 1000); }
export function eligibleItems(farm: FarmState, items: ContentItem[]) {
  const occupied = new Set(farm.crops.map(c => c.itemId));
  return items.filter(i => farm.sources.includes(i.favlist) && !farm.reviewed.includes(i.id) && !occupied.has(i.id));
}
export function memorialFamilyKey(family: string | undefined) {
  if (!family) return "unknown";
  return family.replace(/^(autumn|spring)-/, "").replace("morning-glory", "morningGlory").replace("pea-shoot", "peaShoots");
}
export function roundProgress(farm: FarmState, items: ContentItem[]) {
  const selected = items.filter(i => farm.sources.includes(i.favlist));
  const count = selected.filter(i => farm.reviewed.includes(i.id)).length;
  return { count, total: selected.length, complete: selected.length > 0 && count === selected.length };
}
export type FarmAction =
  | { type: "ENTER"; guide?: Crop }
  | { type: "PLANT"; crop: Crop }
  | { type: "CARE"; id: string; now: number }
  | { type: "UPROOT"; id: string }
  | { type: "HARVEST"; id: string; now: number }
  | { type: "SOURCES"; sources: string[] }
  | { type: "NEXT_ROUND" }
  | { type: "CHECK_ACHIEVEMENTS"; now: number }
  | { type: "ADVANCE"; milliseconds: number };
/** Pure commands validate against the current state, including rapid/repeated clicks. */
export function reduceFarm(farm: FarmState, action: FarmAction, items: ContentItem[]): FarmState {
  switch (action.type) {
    case "ENTER": {
      if (farm.entered) return farm;
      return { ...farm, entered: true, crops: action.guide ? [action.guide] : [], gardenSince: action.guide?.plantedAt ?? null };
    }
    case "PLANT": {
      const crop = action.crop;
      if (!Number.isInteger(crop.plot) || crop.plot < 0 || crop.plot >= PLOT_COUNT || farm.crops.some(c => c.plot === crop.plot) || !eligibleItems(farm, items).some(i => i.id === crop.itemId)) return farm;
      return { ...farm, crops: [...farm.crops, crop], gardenSince: farm.gardenSince ?? crop.plantedAt, plantedCount: farm.plantedCount + 1, starterFamily: farm.starterFamily ?? crop.assetFamily };
    }
    case "CARE": {
      const crop = farm.crops.find(c => c.id === action.id);
      if (!crop || crop.caredAt !== undefined || stageOf(crop, action.now) === "mature") return farm;
      return { ...farm, crops: farm.crops.map(c => c.id === crop.id ? { ...c, careSeconds: Math.ceil(c.durationMs / 1000), caredAt: action.now } : c) };
    }
    case "UPROOT": {
      const crops = farm.crops.filter(c => c.id !== action.id);
      return { ...farm, crops, gardenSince: crops.length ? farm.gardenSince : null };
    }
    case "HARVEST": {
      const crop = farm.crops.find(c => c.id === action.id);
      const item = items.find(i => i.id === crop?.itemId);
      if (!crop || !item || stageOf(crop, action.now) !== "mature" || farm.reviewed.includes(item.id)) return farm;
      const crops = farm.crops.filter(c => c.id !== crop.id);
      return { ...farm, crops, reviewed: [...farm.reviewed, item.id], log: [{ id: crop.id, item, at: action.now, round: farm.round, assetFamily: crop.assetFamily }, ...farm.log], gardenSince: crops.length ? farm.gardenSince : null };
    }
    case "SOURCES": {
      const valid = new Set(items.map(i => i.favlist));
      const sources = [...new Set(action.sources.filter(s => valid.has(s)))];
      return sources.length ? { ...farm, sources } : farm;
    }
    case "CHECK_ACHIEVEMENTS": {
      const achievements = [...new Set([...farm.achievements, ...(farm.log.length >= 1 ? ["first"] : []), ...(farm.log.length >= 10 ? ["ten"] : []), ...(farm.gardenSince !== null && action.now - farm.gardenSince >= 604800000 ? ["caretaker"] : [])])];
      return achievements.length > farm.achievements.length ? { ...farm, achievements } : farm;
    }
    case "NEXT_ROUND":
      return roundProgress(farm, items).complete || (eligibleItems(farm, items).length === 0 && farm.crops.length < PLOT_COUNT) ? { ...farm, round: farm.round + 1, reviewed: [] } : farm;
    case "ADVANCE":
      return { ...farm, crops: farm.crops.map(c => ({ ...c, plantedAt: c.plantedAt - Math.max(0, action.milliseconds) })) };
  }
}
export function seasonForDate(date = new Date()): Season { const month = date.getMonth() + 1; return month >= 3 && month <= 8 ? "spring" : "autumn"; }
export function seasonalFamilies(season: Season) { return season === "spring" ? ["spring-spinach", "spring-strawberry", "spring-pansy", "spring-tomato", "spring-pea-shoot"] : ["autumn-cabbage", "autumn-radish", "autumn-morning-glory", "autumn-cauliflower", "autumn-grape"]; }
export function makeCrop(plot: number, itemId: string, now: number, mode: Mode, random = Math.random(), season: Season = "autumn", familyOverride?: string): Crop {
  const families = seasonalFamilies(season);
  const family = familyOverride ?? families[Math.min(families.length - 1, Math.floor(Math.max(0, Math.min(.999999, random)) * families.length))];
  return { id: crypto.randomUUID(), plot, itemId, zoneId: "main-field", plantedAt: now, durationMs: Math.round((mode === "demo" ? DEMO_DURATION : 600_000) * (.9 + random * .2)), careSeconds: 0, assetFamily: family };
}


