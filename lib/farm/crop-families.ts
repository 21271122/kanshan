/** Stable save identifiers. Appearance never changes a memory's probability or grow time. */
export const cropFamilies = [
  { id: "cabbage", name: "小白菜" },
  { id: "radish", name: "樱桃萝卜" },
  { id: "morning-glory", name: "牵牛花" },
  { id: "cauliflower", name: "花椰菜" },
  { id: "grape", name: "葡萄" },
] as const;
export type CropFamily = typeof cropFamilies[number]["id"];
export function normalizeCropFamily(value?: string): CropFamily {
  if (value === "morningGlory") return "morning-glory";
  return cropFamilies.find(f => f.id === value)?.id ?? "cabbage";
}
export function cropFamilyName(value?: string) {
  return cropFamilies.find(f => f.id === normalizeCropFamily(value))!.name;
}
export function chooseCropFamily(random = Math.random()): CropFamily {
  const value = Number.isFinite(random) ? Math.max(0, Math.min(random, 1)) : 0;
  return cropFamilies[Math.min(cropFamilies.length - 1, Math.floor(value * cropFamilies.length))].id;
}
