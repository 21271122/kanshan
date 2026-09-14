const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { emptyFarm, makeCrop, reduceFarm, stageOf, eligibleItems, roundProgress } = require("../lib/farm/model.ts");
const { demoItems, isContentUrl, parseCollectionImport } = require("../lib/farm/catalog.ts");
const { initialWorkspace, restoreWorkspace, migrateLegacy } = require("../lib/farm/storage.ts");
let passed = 0;
function test(name, fn) { fn(); passed++; console.log("PASS " + name); }
const t = 1_000_000;
const crop = (plot, itemId) => makeCrop(plot, itemId, t, "demo", .5);
test("one plot and one content cannot be planted twice, including rapid commands", () => {
  let farm = emptyFarm(demoItems);
  farm = reduceFarm(farm, { type: "PLANT", crop: crop(0, "a1") }, demoItems);
  assert.equal(reduceFarm(farm, { type: "PLANT", crop: crop(0, "a2") }, demoItems), farm);
  assert.equal(reduceFarm(farm, { type: "PLANT", crop: crop(1, "a1") }, demoItems), farm);
  assert.equal(reduceFarm(farm, { type: "PLANT", crop: crop(10, "a3") }, demoItems), farm);
});
test("water once, with bounded acceleration and no maturity dependency", () => {
  let farm = reduceFarm(emptyFarm(demoItems), { type: "PLANT", crop: crop(0, "a1") }, demoItems);
  assert.equal(stageOf(farm.crops[0], t), "seed");
  const watered = reduceFarm(farm, { type: "CARE", id: farm.crops[0].id, now: t + 1 }, demoItems);
  assert.equal(watered.crops[0].careSeconds, 80);
  assert.equal(reduceFarm(watered, { type: "CARE", id: farm.crops[0].id, now: t + 2 }, demoItems), watered);
  assert.equal(stageOf(watered.crops[0], t + 1), "mature");
});
test("only mature crops can harvest, and a repeat harvest is idempotent", () => {
  const c = crop(0, "a1");
  const farm = reduceFarm(emptyFarm(demoItems), { type: "PLANT", crop: c }, demoItems);
  assert.equal(reduceFarm(farm, { type: "HARVEST", id: c.id, now: t }, demoItems), farm);
  const result = reduceFarm(farm, { type: "HARVEST", id: c.id, now: t + 80_000 }, demoItems);
  assert.equal(result.crops.length, 0); assert.deepEqual(result.reviewed, ["a1"]); assert.equal(result.log.length, 1);
  assert.equal(reduceFarm(result, { type: "HARVEST", id: c.id, now: t + 81_000 }, demoItems), result);
});
test("uproot returns content to pool without changing log", () => {
  const c = crop(0, "a1"), farm = reduceFarm(emptyFarm(demoItems), { type: "PLANT", crop: c }, demoItems);
  const next = reduceFarm(farm, { type: "UPROOT", id: c.id }, demoItems);
  assert.equal(eligibleItems(next, demoItems).length, demoItems.length); assert.equal(next.log.length, 0);
});
test("new rounds require completion, preserve records and outside-source crops", () => {
  const farm = emptyFarm(demoItems);
  assert.equal(reduceFarm(farm, { type: "NEXT_ROUND" }, demoItems), farm);
  const all = { ...farm, reviewed: demoItems.map(i => i.id), log: [{ id: "log", item: demoItems[0], at: t, round: 1 }] };
  const next = reduceFarm(all, { type: "NEXT_ROUND" }, demoItems);
  assert.equal(next.round, 2); assert.equal(next.reviewed.length, 0); assert.equal(next.log.length, 1);
  assert.equal(roundProgress(next, demoItems).count, 0);
});
test("source changes leave planted memories intact", () => {
  const c = crop(0, "a1"), farm = reduceFarm(emptyFarm(demoItems), { type: "PLANT", crop: c }, demoItems);
  const next = reduceFarm(farm, { type: "SOURCES", sources: ["灵感与创作"] }, demoItems);
  assert.deepEqual(next.crops, farm.crops);
  assert(eligibleItems(next, demoItems).every(i => i.favlist === "灵感与创作"));
});
test("imports accept only Zhihu content permalinks and deduplicate canonical links", () => {
  ["javascript:alert(1)", "https://www.zhihu.com.evil.test/question/1/answer/2", "https://www.zhihu.com", "http://www.zhihu.com/question/1/answer/2", "https://u:p@www.zhihu.com/question/1/answer/2"].forEach(u => assert.equal(isContentUrl(u), false));
  const result = parseCollectionImport(JSON.stringify([{ title: "A", url: "https://www.zhihu.com/question/1/answer/2?share=1" }, { title: "B", url: "https://www.zhihu.com/question/1/answer/2" }]));
  assert.equal(result.length, 1); assert.equal(result[0].id, "https://www.zhihu.com/question/1/answer/2");
  assert.throws(() => parseCollectionImport("{}"));
});
test("legacy saves migrate without inventing dates", () => {
  const result = migrateLegacy(JSON.stringify({ entered: true, sources: [demoItems[0].favlist], crops: [{ id: "old", plot: 0, itemId: "a2", plantedAt: t, careSeconds: 18 }], reviewed: ["a1"] }));
  assert.equal(result.demo.log[0].at, null); assert.equal(result.demo.crops[0].durationMs, 80_000);
  assert.equal(result.demo.crops[0].caredAt, t);
});
test("invalid, duplicate and orphan crops are removed on restore", () => {
  const w = initialWorkspace(), c = crop(0, "a1");
  w.demo.crops = [c, { ...c, id: "duplicate" }, { ...c, plot: 4, itemId: "absent" }, { ...c, plot: 11 }];
  const result = restoreWorkspace(JSON.stringify(w));
  assert.equal(result.demo.crops.length, 1);
  assert.throws(() => restoreWorkspace('{"version":99}'));
});

test("earned caretaker milestone survives an emptied field and save restore", () => {
  const c = crop(0, "a1");
  const farm = { ...reduceFarm(emptyFarm(demoItems), { type: "PLANT", crop: c }, demoItems), gardenSince: t };
  const earned = reduceFarm(farm, { type: "CHECK_ACHIEVEMENTS", now: t + 604800000 }, demoItems);
  assert(earned.achievements.includes("caretaker"));
  const cleared = reduceFarm(earned, { type: "UPROOT", id: c.id }, demoItems);
  const w = initialWorkspace(); w.demo = cleared;
  assert(restoreWorkspace(JSON.stringify(w)).demo.achievements.includes("caretaker"));
});
test("new workspace round-trip preserves independent personal/demo farms", () => {
  const w = initialWorkspace();
  w.personalItems = parseCollectionImport(JSON.stringify([{title:"Real metadata",url:"https://zhuanlan.zhihu.com/p/123"}]));
  w.personal = emptyFarm(w.personalItems); w.mode = "personal";
  const restored = restoreWorkspace(JSON.stringify(w));
  assert.equal(restored.personalItems[0].url,"https://zhuanlan.zhihu.com/p/123");
  assert.equal(restored.demo.sources.length,3); assert.equal(restored.personal.sources.length,1);
});

console.log(passed + " core tests passed");


