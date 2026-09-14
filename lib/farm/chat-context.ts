import type { FarmState, Workspace } from "./model";

export type FarmChatSnapshot = {
  mode: "demo" | "personal";
  authenticated: boolean;
  displayName?: string;
  harvestCount: number;
  uniqueMemoryCount: number;
  plantedCount: number;
  currentCropCount: number;
  matureCropCount: number;
  cropHarvestCounts: Array<{ cropType: string; count: number }>;
  latestHarvestTitle?: string;
  latestHarvestAt?: number | null;
};

const cropName: Record<string, string> = {
  "autumn-cabbage": "小白菜", "autumn-radish": "樱桃萝卜", "autumn-morning-glory": "牵牛花",
  "autumn-cauliflower": "花椰菜", "autumn-grape": "葡萄", "autumn-pea-shoot": "豌豆苗",
  "spring-spinach": "菠菜", "spring-strawberry": "草莓", "spring-pansy": "三色堇",
  "spring-tomato": "西红柿", "spring-pea-shoot": "豌豆苗", cabbage: "小白菜",
  radish: "樱桃萝卜", morningGlory: "牵牛花", cauliflower: "花椰菜", grape: "葡萄", peaShoots: "豌豆苗",
};

export function makeFarmChatSnapshot(workspace: Workspace, farm: FarmState, authenticated: boolean, displayName?: string, matureCropCount = 0): FarmChatSnapshot {
  const counts = new Map<string, number>();
  for (const entry of farm.log) {
    const name = cropName[entry.assetFamily || ""] || "作物";
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const latest = farm.log[0];
  return {
    mode: workspace.mode,
    authenticated,
    displayName,
    harvestCount: farm.log.length,
    uniqueMemoryCount: new Set(farm.log.map(entry => entry.item.id)).size,
    plantedCount: farm.plantedCount,
    currentCropCount: farm.crops.length,
    matureCropCount,
    cropHarvestCounts: [...counts.entries()].map(([cropType, count]) => ({ cropType, count })).sort((a, b) => b.count - a.count),
    latestHarvestTitle: latest?.item.title,
    latestHarvestAt: latest?.at,
  };
}

