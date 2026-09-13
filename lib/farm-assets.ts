import type { Stage } from "./farm/model";
import { cropFamilies, normalizeCropFamily } from "./farm/crop-families";
export type AssetRef = { src: string; available?: boolean; format: "png" | "gif" | "webp"; width: number; height: number; alt?: string; fallback?: string; durationMs?: number; loop?: boolean; presentation?: "sprite" | "illustration"; portrait?: { src: string; width: number; height: number } };
export type FarmAssetManifest = {
  scenes: { main: AssetRef; welcome?: AssetRef; evening?: AssetRef; lockedField?: AssetRef };
  terrain: { emptyPlot: AssetRef; lockedPlot: AssetRef; soil: AssetRef };
  crops: Record<string, Record<Stage, AssetRef>>;
  mascot: { idle: AssetRef; planting?: AssetRef; watering?: AssetRef; noticing?: AssetRef; celebrate?: AssetRef; thinking?: AssetRef };
  effects: { water?: AssetRef; sparkle?: AssetRef; harvest?: AssetRef; unlock?: AssetRef };
};
const png = (src: string, alt?: string): AssetRef => ({ src, available: false, format: "png", width: 256, height: 256, alt });
const gif = (src: string, fallback: string, loop: boolean, durationMs?: number): AssetRef => ({ src, available: false, format: "gif", width: 320, height: 320, fallback, loop, durationMs });
const crops: FarmAssetManifest["crops"] = Object.fromEntries(cropFamilies.map(({ id, name }) => [
  id, Object.fromEntries((["seed", "sprout", "mature"] as const).map((stage, index) => [stage, {
    src: "/assets/farm/crops/" + id + "/" + stage + ".webp",
    available: false, format: "webp", width: 512, height: 512, presentation: "illustration",
    alt: name + " · " + ["种植期", "生长期", "成熟期"][index],
  }])) as Record<Stage, AssetRef>,
]));
crops.default = crops.cabbage;
const background = (file: string, width: number, height: number): AssetRef => ({
  src: "/assets/farm/scenes/" + file, available: false, format: "webp", width, height,
  alt: "秋日林间的看山沃野",
  portrait: { src: "/assets/farm/scenes/autumn-mobile.webp", width: 900, height: 1600 },
});
export const farmAssets: FarmAssetManifest = {
  scenes: { main: background("autumn-field.webp", 1920, 1080), welcome: background("autumn-welcome.webp", 1672, 941) },
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
  return (farmAssets.crops[family ?? "default"] ?? farmAssets.crops[normalizeCropFamily(family)])[stage];
}
export function resolveAsset(ref: AssetRef, reduceMotion = false): string {
  return reduceMotion && ref.fallback ? ref.fallback : ref.src;
}
export type FarmZone = { id: string; name: string; unlocked: boolean; background: AssetRef; plotCount: number; assetFamily: string };
export const mascotActionForEvent = { PLANT: "planting", CARE: "watering", MATURE: "noticing", HARVEST: "celebrate", UPROOT: "idle" } as const;
export function durationForEvent(type: keyof typeof mascotActionForEvent) { return farmAssets.mascot[mascotActionForEvent[type]]?.durationMs ?? 1500; }
