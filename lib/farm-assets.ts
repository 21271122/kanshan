import type { Stage } from "./farm/model";
export type AssetRef = { src: string; available?: boolean; format: "png" | "gif" | "webp"; width: number; height: number; alt?: string; fallback?: string; durationMs?: number; loop?: boolean; presentation?: "sprite" | "illustration"; portrait?: { src: string; width: number; height: number } };
export type FarmAssetManifest = {
  scenes: { main: AssetRef; welcome?: AssetRef; evening?: AssetRef; lockedField?: AssetRef; springMain?: AssetRef; springWelcome?: AssetRef };
  terrain: { emptyPlot: AssetRef; lockedPlot: AssetRef; soil: AssetRef };
  crops: Record<string, Record<Stage, AssetRef>>;
  mascot: { idle: AssetRef; planting?: AssetRef; watering?: AssetRef; noticing?: AssetRef; celebrate?: AssetRef; thinking?: AssetRef };
  effects: { water?: AssetRef; sparkle?: AssetRef; harvest?: AssetRef; unlock?: AssetRef };
};
const png = (src: string, alt?: string): AssetRef => ({ src, available: true, format: src.endsWith(".webp") ? "webp" : "png", width: 256, height: 256, alt });
const gif = (src: string, fallback: string, loop: boolean, durationMs?: number): AssetRef => ({ src, available: false, format: "gif", width: 320, height: 320, fallback, loop, durationMs });
const crops: FarmAssetManifest["crops"] = {
  "spring-spinach": { seed: png("/assets/farm/crops/spring-spinach/seed.png", "菠菜种植期"), sprout: png("/assets/farm/crops/spring-spinach/sprout.png", "菠菜生长期"), mature: png("/assets/farm/crops/spring-spinach/mature.png", "菠菜成熟期") },
  "spring-strawberry": { seed: png("/assets/farm/crops/spring-strawberry/seed.png", "草莓种植期"), sprout: png("/assets/farm/crops/spring-strawberry/sprout.png", "草莓生长期"), mature: png("/assets/farm/crops/spring-strawberry/mature.png", "草莓成熟期") },
  "spring-pansy": { seed: png("/assets/farm/crops/spring-pansy/seed.png", "三色堇种植期"), sprout: png("/assets/farm/crops/spring-pansy/sprout.png", "三色堇生长期"), mature: png("/assets/farm/crops/spring-pansy/mature.png", "三色堇开花期") },
  "spring-tomato": { seed: png("/assets/farm/crops/spring-tomato/seed.png", "西红柿种植期"), sprout: png("/assets/farm/crops/spring-tomato/sprout.png", "西红柿生长期"), mature: png("/assets/farm/crops/spring-tomato/mature.png", "西红柿成熟期") },
  "spring-pea-shoot": { seed: png("/assets/farm/crops/spring-pea-shoot/seed.png", "豌豆苗种植期"), sprout: png("/assets/farm/crops/spring-pea-shoot/sprout.png", "豌豆苗生长期"), mature: png("/assets/farm/crops/spring-pea-shoot/mature.png", "豌豆苗成熟期") },
  default: { seed: png("/assets/farm/crops/cabbage/seed.webp", "小白菜种植期"), sprout: png("/assets/farm/crops/cabbage/sprout.webp", "小白菜生长期"), mature: png("/assets/farm/crops/cabbage/mature.webp", "小白菜成熟期") },
  cabbage: { seed: png("/assets/farm/crops/cabbage/seed.webp", "小白菜种植期"), sprout: png("/assets/farm/crops/cabbage/sprout.webp", "小白菜生长期"), mature: png("/assets/farm/crops/cabbage/mature.webp", "小白菜成熟期") },
  radish: { seed: png("/assets/farm/crops/radish/seed.webp", "樱桃萝卜种植期"), sprout: png("/assets/farm/crops/radish/sprout.webp", "樱桃萝卜生长期"), mature: png("/assets/farm/crops/radish/mature.webp", "樱桃萝卜成熟期") },
  morningGlory: { seed: png("/assets/farm/crops/morning-glory/seed.webp", "牵牛花种植期"), sprout: png("/assets/farm/crops/morning-glory/sprout.webp", "牵牛花生长期"), mature: png("/assets/farm/crops/morning-glory/mature.webp", "牵牛花成熟期") },
  cauliflower: { seed: png("/assets/farm/crops/cauliflower/seed.webp", "花椰菜种植期"), sprout: png("/assets/farm/crops/cauliflower/sprout.webp", "花椰菜生长期"), mature: png("/assets/farm/crops/cauliflower/mature.webp", "花椰菜成熟期") },
  grape: { seed: png("/assets/farm/crops/grape/seed.webp", "葡萄种植期"), sprout: png("/assets/farm/crops/grape/sprout.webp", "葡萄生长期"), mature: png("/assets/farm/crops/grape/mature.webp", "葡萄成熟期") },
  peaShoots: { seed: png("/assets/farm/crops/pea-shoot/seed.webp", "豌豆苗种植期"), sprout: png("/assets/farm/crops/pea-shoot/sprout.webp", "豌豆苗生长期"), mature: png("/assets/farm/crops/pea-shoot/mature.webp", "豌豆苗成熟期") },
  "autumn-cabbage": { seed: png("/assets/farm/crops/autumn-cabbage/seed.png", "小白菜种植期"), sprout: png("/assets/farm/crops/autumn-cabbage/sprout.png", "小白菜生长期"), mature: png("/assets/farm/crops/autumn-cabbage/mature.png", "小白菜成熟期") },
  "autumn-radish": { seed: png("/assets/farm/crops/autumn-radish/seed.png", "樱桃萝卜种植期"), sprout: png("/assets/farm/crops/autumn-radish/sprout.png", "樱桃萝卜生长期"), mature: png("/assets/farm/crops/autumn-radish/mature.png", "樱桃萝卜成熟期") },
  "autumn-morning-glory": { seed: png("/assets/farm/crops/autumn-morning-glory/seed.png", "牵牛花种植期"), sprout: png("/assets/farm/crops/autumn-morning-glory/sprout.png", "牵牛花生长期"), mature: png("/assets/farm/crops/autumn-morning-glory/mature.png", "牵牛花成熟期") },
  "autumn-cauliflower": { seed: png("/assets/farm/crops/autumn-cauliflower/seed.png", "花椰菜种植期"), sprout: png("/assets/farm/crops/autumn-cauliflower/sprout.png", "花椰菜生长期"), mature: png("/assets/farm/crops/autumn-cauliflower/mature.png", "花椰菜成熟期") },
  "autumn-grape": { seed: png("/assets/farm/crops/autumn-grape/seed.png", "葡萄种植期"), sprout: png("/assets/farm/crops/autumn-grape/sprout.png", "葡萄生长期"), mature: png("/assets/farm/crops/autumn-grape/mature.png", "葡萄成熟期") },
  "autumn-pea-shoot": { seed: png("/assets/farm/crops/autumn-pea-shoot/seed.png", "豌豆苗种植期"), sprout: png("/assets/farm/crops/autumn-pea-shoot/sprout.png", "豌豆苗生长期"), mature: png("/assets/farm/crops/autumn-pea-shoot/mature.png", "豌豆苗成熟期") }
};
const background = (file: string, width: number, height: number, portraitFile = "autumn-mobile.webp"): AssetRef => ({
  src: "/assets/farm/scenes/" + file, available: true, format: "webp", width, height,
  alt: "秋日林间的看山沃野",
  portrait: { src: "/assets/farm/scenes/" + portraitFile, width: 900, height: 1600 },
});
export const farmAssets: FarmAssetManifest = {
  scenes: { main: background("autumn-field.png", 1920, 1080), welcome: background("autumn-welcome.png", 1920, 1080), springMain: background("spring-field.png", 1920, 1080, "spring-mobile.png"), springWelcome: background("spring-welcome.png", 1920, 1080, "spring-mobile.png") },
  terrain: { emptyPlot: png("/assets/farm/terrain/plot-empty.png", "空地"), lockedPlot: png("/assets/farm/terrain/plot-locked.png", "尚未解锁的土地"), soil: png("/assets/farm/terrain/plot-soil.png", "已开垦土地") },
  crops,
  mascot: {
    idle: { ...gif("/assets/liukanshan-idle.gif", "/assets/farm/mascot/idle.png", true), available: true, alt: "刘看山在农场待机" },
    planting: gif("/assets/farm/mascot/planting.gif", "/assets/farm/mascot/idle.png", false, 1500),
    watering: gif("/assets/farm/mascot/watering.gif", "/assets/farm/mascot/idle.png", false, 1200),
    noticing: gif("/assets/farm/mascot/noticing.gif", "/assets/farm/mascot/idle.png", false, 1200),
    celebrate: gif("/assets/farm/mascot/celebrate.gif", "/assets/farm/mascot/idle.png", false, 1800),
  },
  effects: { water: png("/assets/farm/effects/water.png"), sparkle: png("/assets/farm/effects/sparkle.png"), harvest: { ...gif("/assets/farm/effects/harvest.gif", "/assets/farm/effects/sparkle.png", false, 900), width: 256, height: 256 } }
};
export function assetForCrop(family: string | undefined, stage: Stage): AssetRef {
  return (farmAssets.crops[family ?? "default"] ?? farmAssets.crops.default)[stage];
}
export function resolveAsset(ref: AssetRef, reduceMotion = false): string {
  return reduceMotion && ref.fallback ? ref.fallback : ref.src;
}
export type FarmZone = { id: string; name: string; unlocked: boolean; background: AssetRef; plotCount: number; assetFamily: string };
export const mascotActionForEvent = { PLANT: "planting", CARE: "watering", MATURE: "noticing", HARVEST: "celebrate", UPROOT: "idle" } as const;
export function durationForEvent(type: keyof typeof mascotActionForEvent) { return farmAssets.mascot[mascotActionForEvent[type]]?.durationMs ?? 1500; }

