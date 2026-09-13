"use client";
import { durationForEvent } from "../../lib/farm-assets";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoItems, mergeCollectionItems, parseCollectionImport } from "../../lib/farm/catalog";
import { DEMO_DURATION, FarmAction, FarmEvent, Mode, emptyFarm, eligibleItems, makeCrop, reduceFarm, stageOf, type Workspace } from "../../lib/farm/model";
import { LEGACY_KEY, STORAGE_KEY, initialWorkspace, migrateLegacy, restoreWorkspace, validDestination } from "../../lib/farm/storage";

export function useFarm() {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const current = useRef(workspace);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [event, setEvent] = useState<FarmEvent | null>(null);
  const [auth, setAuth] = useState<{ authenticated: boolean; user?: { name: string; avatar?: string } } | null>(null);
  const seenMature = useRef(new Set<string>());
  const commit = useCallback((next: Workspace) => { current.current = next; setWorkspace(next); }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY), legacy = localStorage.getItem(LEGACY_KEY);
      if (stored) commit(restoreWorkspace(stored));
      else if (legacy) { commit(migrateLegacy(legacy)); setNotice("已找回原来的演示农场。旧记录保留，未记录的日期显示为未知。"); }
    } catch { setStorageWarning("未能读取本地存档。当前可继续体验；原存档保留，请先导出备份或在设置中重建。"); }
    setNow(Date.now()); setReady(true);
  }, [commit]);
  useEffect(() => { fetch("/api/auth/status").then(r => r.json()).then(setAuth).catch(() => setAuth({ authenticated: false })); }, []);
  const saveBlocked = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (storageWarning.startsWith("未能读取")) { saveBlocked.current = true; return; }
    if (saveBlocked.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); setStorageWarning(""); }
    catch { setStorageWarning("浏览器暂时无法保存。当前操作仍有效，关闭页面前请在设置中导出备份。"); }
  }, [workspace, ready, storageWarning]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5800);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(() => setEvent(null), durationForEvent(event.type));
    return () => clearTimeout(timer);
  }, [event]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try { commit(restoreWorkspace(e.newValue)); setNotice("已同步同一浏览器其他窗口的最新农场。"); } catch { /* Ignore invalid remote saves. */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [commit]);

  const mode = workspace.mode, farm = workspace[mode], items = mode === "demo" ? demoItems : workspace.favoritePool.filter(i => !workspace.consumedUrls.includes(i.url));
  useEffect(() => {
    if (!ready || !farm.entered) return;
    const w = current.current, catalog = w.mode === "demo" ? demoItems : w.favoritePool;
    const next = reduceFarm(w[w.mode], { type: "CHECK_ACHIEVEMENTS", now }, catalog);
    if (next !== w[w.mode]) commit({ ...w, [w.mode]: next });
  }, [ready, now, farm, commit]);
  useEffect(() => {
    if (!ready || !now) return;
    const mature = farm.crops.filter(c => stageOf(c, now) === "mature");
    const found = mature.find(c => !seenMature.current.has(mode + c.id));
    mature.forEach(c => seenMature.current.add(mode + c.id));
    if (found) { setEvent({ type: "MATURE", plot: found.plot, at: Date.now() }); if (farm.entered) setNotice("有一段回忆成熟了。它会一直等你，随时来收获。"); }
  }, [farm.crops, farm.entered, mode, ready, now]);
  function dispatch(action: FarmAction) {
    const w = current.current, catalog = w.mode === "demo" ? demoItems : w.favoritePool;
    const nextFarm = reduceFarm(w[w.mode], action, catalog);
    if (nextFarm === w[w.mode]) return false;
    commit({ ...w, [w.mode]: nextFarm }); return true;
  }
  function start(mode: Mode = current.current.mode) {
    const w = current.current, catalog = mode === "demo" ? demoItems : w.personalItems, state = w[mode];
    const first = eligibleItems(state, catalog)[0];
    const guide = first ? { ...makeCrop(0, first.id, Date.now(), mode, .5), plantedAt: Date.now() - (mode === "demo" ? DEMO_DURATION : 600_000) - 1000 } : undefined;
    commit({ ...w, mode, [mode]: reduceFarm(state, { type: "ENTER", guide }, catalog) });
  }
  function plant(plot: number) {
    const w = current.current, state = w[w.mode], catalog = w.mode === "demo" ? demoItems : w.favoritePool;
    if (state.crops.some(c => c.plot === plot)) return;
    const eligible = eligibleItems(state, catalog);
    if (!eligible.length) { setNotice(catalog.length ? "本轮收藏已种下或已收获。看看成熟果实，或在内容来源里添加收藏。" : "先在内容来源里导入一些旧收藏，再来播种吧。"); return; }
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    if (dispatch({ type: "PLANT", crop: makeCrop(plot, chosen.id, Date.now(), w.mode) })) {
      setEvent({ type: "PLANT", plot, at: Date.now() }); setNotice("种好啦！这段回忆来自「" + chosen.favlist + "」。");
    }
  }
  function care(id: string) {
    const crop = current.current[current.current.mode].crops.find(c => c.id === id);
    if (crop && dispatch({ type: "CARE", id, now: Date.now() })) {
      setEvent({ type: "CARE", plot: crop.plot, at: Date.now() }); setNotice("水浇好啦，早一点见面。成熟时间缩短约 10%。");
    }
  }
  function uproot(id: string) {
    const crop = current.current[current.current.mode].crops.find(c => c.id === id);
    dispatch({ type: "UPROOT", id }); if (crop) setEvent({ type: "UPROOT", plot: crop.plot, at: Date.now() });
    setNotice("作物收回了土里，收藏回到待重温池，随时可以再种。");
  }
  function harvest(id: string) {
    const w = current.current, crop = w[w.mode].crops.find(c => c.id === id), catalog = w.mode === "demo" ? demoItems : w.favoritePool;
    const item = catalog.find(i => i.id === crop?.itemId);
    if (!crop || !item || stageOf(crop, Date.now()) !== "mature" || !validDestination(item, w.mode)) return false;
    // Synchronous to the click: a blocked popup must never count as a harvest.
    const popup = window.open("about:blank", "_blank");
    if (!popup) { setNotice("浏览器拦截了新标签页，请允许此站点弹窗后再打开；这株作物仍然保留。"); return false; }
    try { popup.opener = null; popup.location.href = item.url; }
    catch { popup.close(); setNotice("原帖暂时无法打开，作物仍为你保留。"); return false; }
    dispatch({ type: "HARVEST", id, now: Date.now() });
    if (w.mode === "personal") { const next = current.current; commit({ ...next, favoritePool: next.favoritePool.filter(i => i.url !== item.url), consumedUrls: [...new Set([...next.consumedUrls, item.url])] }); }
    setEvent({ type: "HARVEST", plot: crop.plot, at: Date.now() });
    setNotice(w.mode === "demo" ? "体验收获 +1。演示话题已在知乎搜索中打开。" : "重温 +1。原帖已打开，也收进了你的收获记录。");
    return true;
  }
  function importCollections(text: string) {
    const incoming = parseCollectionImport(text), w = current.current;
    const personalItems = mergeCollectionItems(w.personalItems, incoming);
    const pool = mergeCollectionItems(w.favoritePool as any, incoming) as any;
    if (pool.length > 2000) throw new Error("个人农场最多保留 2000 篇收藏，请减少本次导入数量。");
    const sources = [...new Set([...w.personal.sources, ...incoming.map(i => i.favlist)])];
    commit({ ...w, mode: "personal", personalItems, favoritePool: pool, personal: { ...w.personal, sources } });
    setNotice("已导入 " + incoming.length + " 篇收藏。演示农场和个人农场分别保存。");
    return incoming.length;
  }
  function reset(mode: Mode, eraseImportedItems = false) {
    const w = current.current;
    saveBlocked.current = false; setStorageWarning("");
    commit({ ...w, ...(mode === "personal" && eraseImportedItems ? { personalItems: [], favoritePool: [], consumedUrls: [] } : {}), [mode]: emptyFarm(mode === "demo" ? demoItems : eraseImportedItems ? [] : w.personalItems) });
    setNotice(eraseImportedItems && mode === "personal" ? "个人农场和本机导入的收藏已清除，不影响知乎原收藏。" : "当前农场记录已清除，收藏内容仍然保留。");
  }
  function exportSave() {
    let saved = JSON.stringify(current.current, null, 2);
    if (saveBlocked.current) try { saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY) ?? saved; } catch { /* Export in-memory state. */ }
    const url = URL.createObjectURL(new Blob([saved], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "kanshan-farm-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function restoreSave(text: string) {
    const next = restoreWorkspace(text); saveBlocked.current = false; setStorageWarning(""); commit(next); setNotice("农场备份已恢复。");
  }
  function switchMode(mode: Mode) { if (mode === "personal" && !auth?.authenticated) { window.location.href = "/api/auth/zhihu?returnTo=personal"; return; } commit({ ...current.current, mode }); setNotice(mode === "demo" ? "已回到演示农场。" : "已回到个人收藏农场。"); }
  return { ready, now, mode, farm, items, workspace, event, notice, storageWarning, auth, start, plant, care, uproot, harvest, importCollections, reset, exportSave, restoreSave, switchMode, dispatch, setNotice };
}







