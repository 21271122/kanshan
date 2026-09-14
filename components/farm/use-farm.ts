"use client";
import { durationForEvent } from "../../lib/farm-assets";
import { useCallback, useEffect, useRef, useState } from "react";
import { demoItems, mergeCollectionItems } from "../../lib/farm/catalog";
import { DEMO_DURATION, FarmAction, FarmEvent, Mode, emptyFarm, eligibleItems, makeCrop, reduceFarm, roundProgress, stageOf, memorialFamilyKey, seasonForDate, seasonalFamilies, type ContentItem, type Workspace, type FarmState, type Season, type SeasonMode } from "../../lib/farm/model";
import { LEGACY_KEY, STORAGE_KEY, favoritesStorageKey, initialPersonalWorkspace, initialWorkspace, personalStorageKey, restorePersonalWorkspace, restoreWorkspace } from "../../lib/farm/storage";
import { makeFarmChatSnapshot } from "../../lib/farm/chat-context";

type Auth = { authenticated: boolean; user?: { id: string; name: string; avatar?: string }; sessionId?: string };
type SyncData = { folders: Array<{ token: string; title: string; count: number | null }>; items: ContentItem[]; syncedAt: number };

export function useFarm() {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const current = useRef(workspace);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [event, setEvent] = useState<FarmEvent | null>(null);
  const [memorial, setMemorial] = useState<{ family: string; season: Season } | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [favlistsLoading, setFavlistsLoading] = useState(false);
  const [favlistsError, setFavlistsError] = useState("");
  const [syncProgress, setSyncProgress] = useState("");
  const seenMature = useRef(new Set<string>());
  const memorialPending = useRef(new Set<string>());
  const saveBlocked = useRef(false);
  const accountId = useRef<string | null>(null);
  const commit = useCallback((next: Workspace, persist = true) => {
    current.current = next; setWorkspace(next);
    if (persist && next.mode === "personal" && accountId.current) {
      try { localStorage.setItem(personalStorageKey(accountId.current), JSON.stringify(next)); } catch { setStorageWarning("浏览器暂时无法保存当前账号的农场。"); }
    }
  }, []);

  const triggerMemorial = useCallback((base: Workspace, farm: FarmState, preferredFamily?: string) => {
    const counts = new Map<string, number>();
    for (const entry of farm.log) {
      const key = memorialFamilyKey(entry.assetFamily);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const keys = preferredFamily ? [memorialFamilyKey(preferredFamily)] : [...counts.keys()];
    for (const key of keys) {
      if ((counts.get(key) ?? 0) < 3) continue;
      const marker = "memorial:" + key;
      const scope = base.mode + ":" + (accountId.current ?? "demo") + ":" + marker;
      if (farm.achievements.includes(marker)) {
        memorialPending.current.delete(scope);
        continue;
      }
      if (memorialPending.current.has(scope)) continue;
      const family = farm.log.find(entry => memorialFamilyKey(entry.assetFamily) === key)?.assetFamily;
      if (!family) continue;
      memorialPending.current.add(scope);
      const nextFarm = { ...farm, achievements: [...farm.achievements, marker] };
      commit({ ...base, [base.mode]: nextFarm });
      setMemorial({ family, season: base.season });
      break;
    }
  }, [commit]);

  const loadPersonal = useCallback((userId: string, items: ContentItem[] = []) => {
    accountId.current = userId;
    try {
      const raw = localStorage.getItem(personalStorageKey(userId));
      const next = raw ? restorePersonalWorkspace(raw, items) : initialPersonalWorkspace(items);
      commit(next, false);
    } catch { commit(initialPersonalWorkspace(items), false); setNotice("当前账号没有可读取的本地农场存档，将从空农场开始。"); }
  }, [commit]);

  const syncFavorites = useCallback(async (user: Auth["user"], cached: SyncData | null) => {
    if (!user?.id) return;
    setFavlistsLoading(true); setFavlistsError(""); setSyncProgress("正在读取收藏夹列表…");
    try {
      const response = await fetch("/api/favlists", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "知乎收藏夹读取失败");
      const folders: Array<{ token: string; title: string; count: number | null }> = (data.items || []).map((x: any) => ({ token: String(x.token), title: String(x.title || "未命名收藏夹"), count: typeof x.count === "number" ? x.count : null }));
      const failed = (data.items || []).find((x: any) => x.error);
      if (failed) throw new Error(failed.error);
      const incoming = (data.items || []).flatMap((x: any) => Array.isArray(x.contents) ? x.contents : []) as ContentItem[];
      const deduped = Array.from(new Map(incoming.filter(i => i && typeof i.url === "string").map(i => [i.url, i])).values()).slice(0, 2000);
      const nextCache = { userId: user.id, syncedAt: Date.now(), folders, items: deduped };
      localStorage.setItem(favoritesStorageKey(user.id), JSON.stringify(nextCache));
      const w = current.current;
      const oldFolders = w.favoriteFolders.map(f => f.token + ":" + f.title).sort().join("|");
      const newFolders = folders.map(f => f.token + ":" + f.title).sort().join("|");
      const collectionChanged = oldFolders !== newFolders;
      const merged = mergeCollectionItems(w.personalItems, deduped);
      const selectedSources = collectionChanged ? folders.map(f => f.title) : w.personal.sources.filter(s => folders.some(f => f.title === s));
      const next = { ...w, mode: "personal" as const, personalItems: merged, favoritePool: mergeCollectionItems(w.favoritePool, deduped) as any, favoriteFolders: folders.map(f => ({ ...f, total: f.count ?? 0, urls: deduped.filter(i => i.favlist === f.title).map(i => i.url), fetchedAt: nextCache.syncedAt })), personal: { ...w.personal, sources: selectedSources.length ? selectedSources : folders.map(f => f.title) } };
      commit(next);
      setNotice(deduped.length ? "收藏已同步，可以开始种植。" : "账号暂无收藏，已进入空个人农场。");
      return nextCache;
    } catch (error) {
      const message = error instanceof Error ? error.message : "知乎收藏夹读取失败";
      setFavlistsError(message);
      if (cached && cached.syncedAt && Date.now() - cached.syncedAt <= 3 * 86_400_000) {
        setNotice("同步失败，已使用 " + new Date(cached.syncedAt).toLocaleString("zh-CN") + " 的收藏缓存。");
        const w = current.current;
        const merged = mergeCollectionItems(w.personalItems, cached.items);
        commit({ ...w, mode: "personal", personalItems: merged, favoritePool: mergeCollectionItems(w.favoritePool, cached.items) as any, personal: { ...w.personal, sources: w.personal.sources.length ? w.personal.sources : cached.folders.map(f => f.title) } });
        return cached;
      }
      throw error;
    } finally { setFavlistsLoading(false); setSyncProgress(""); }
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const authParams = new URLSearchParams(window.location.search); if (authParams.get("auth") === "error") setNotice(authParams.get("reason") || "知乎登录未完成，请重试。");
      try {
        const demoRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
        if (demoRaw) commit(restoreWorkspace(demoRaw), false);
      } catch { setStorageWarning("未能读取本地演示存档。"); }
      setNow(Date.now()); setReady(true);
      try {
        const next = await fetch("/api/auth/status", { cache: "no-store" }).then(r => r.json()) as Auth;
        if (cancelled) return;
        setAuth(next);
        if (!next.authenticated || !next.user?.id) { accountId.current = null; commit({ ...current.current, mode: "demo" }, false); return; }
        const uid = next.user.id;
        let cached: SyncData | null = null;
        try { const raw = localStorage.getItem(favoritesStorageKey(uid)); if (raw) cached = JSON.parse(raw); } catch {}
        loadPersonal(uid, cached?.items || []);
        const sessionKey = "kanshan-session-" + uid;
        const sameSession = sessionStorage.getItem(sessionKey) === next.sessionId;
        if (sameSession && cached && Date.now() - cached.syncedAt <= 30 * 60_000) {
          const w = current.current;
          const merged = mergeCollectionItems(w.personalItems, cached.items);
          const folders = cached.folders || [];
          commit({ ...w, mode: "personal", personalItems: merged, favoritePool: mergeCollectionItems(w.favoritePool, cached.items) as any, favoriteFolders: folders.map(f => ({ ...f, total: f.count ?? 0, urls: cached!.items.filter(i => i.favlist === f.title).map(i => i.url), fetchedAt: cached!.syncedAt })), personal: { ...w.personal, sources: w.personal.sources.length ? w.personal.sources : folders.map(f => f.title) } });
          setNotice("已使用最近同步的收藏。");
        } else {
          try { await syncFavorites(next.user, cached); } catch { if (!cancelled) { accountId.current = null; setAuth({ authenticated: false }); commit({ ...current.current, mode: "demo", demo: { ...current.current.demo, entered: false } }, false); setNotice("收藏同步失败，请重试登录或进入演示农场。"); } }
        }
        sessionStorage.setItem(sessionKey, next.sessionId || String(Date.now()));
      } catch { if (!cancelled) setAuth({ authenticated: false }); }
    };
    void boot(); return () => { cancelled = true; };
  }, [commit, loadPersonal, syncFavorites]);

  useEffect(() => { if (!ready) return; try { if (workspace.mode === "demo") localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch { setStorageWarning("浏览器暂时无法保存当前农场。"); } }, [workspace, ready]);
  useEffect(() => { const flush = () => { if (accountId.current && current.current.mode === "personal") { try { localStorage.setItem(personalStorageKey(accountId.current), JSON.stringify(current.current)); } catch {} } }; window.addEventListener("beforeunload", flush); return () => window.removeEventListener("beforeunload", flush); }, []);
  useEffect(() => { const tick = () => setNow(Date.now()); const timer = window.setInterval(tick, 1000); document.addEventListener("visibilitychange", tick); return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); }; }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 5800); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (!event) return; const timer = setTimeout(() => setEvent(null), durationForEvent(event.type)); return () => clearTimeout(timer); }, [event]);

  const mode = workspace.mode, farm = workspace[mode], items = mode === "demo" ? demoItems : workspace.favoritePool.filter(i => !workspace.consumedUrls.includes(i.url));
  useEffect(() => { if (!ready || !farm.entered) return; const w = current.current, catalog = w.mode === "demo" ? demoItems : w.favoritePool; const next = reduceFarm(w[w.mode], { type: "CHECK_ACHIEVEMENTS", now }, catalog); if (next !== w[w.mode]) commit({ ...w, [w.mode]: next }); }, [ready, now, farm, commit]);
  useEffect(() => {
    if (!ready) return;
    const w = current.current;
    triggerMemorial(w, w[w.mode]);
  }, [ready, mode, farm.log.length, triggerMemorial]);
  useEffect(() => { if (!ready || !now) return; if (current.current.seasonMode === "auto") { const nextSeason = seasonForDate(new Date(now)); if (nextSeason !== current.current.season) commit({ ...current.current, season: nextSeason, welcomeSeason: nextSeason }); } const mature = farm.crops.filter(c => stageOf(c, now) === "mature"); const found = mature.find(c => !seenMature.current.has(mode + c.id)); mature.forEach(c => seenMature.current.add(mode + c.id)); if (found) { setEvent({ type: "MATURE", plot: found.plot, at: Date.now() }); setNotice("有一段回忆成熟了。它会一直等你，随时来收获。"); } }, [farm.crops, farm.entered, mode, ready, now]);

  const getChatSnapshot = useCallback(() => { const w = current.current, state = w[w.mode], mature = state.crops.filter(crop => stageOf(crop, Date.now()) === "mature").length; return makeFarmChatSnapshot(w, state, !!auth?.authenticated, auth?.user?.name, mature); }, [auth]);
  function dispatch(action: FarmAction) { const w = current.current, catalog = w.mode === "demo" ? demoItems : w.favoritePool; const nextFarm = reduceFarm(w[w.mode], action, catalog); if (nextFarm === w[w.mode]) return false; commit({ ...w, [w.mode]: nextFarm }); return true; }
  function start(target: Mode = current.current.mode) { const w = current.current, catalog = target === "demo" ? demoItems : w.favoritePool; const state = w[target]; const first = target === "demo" ? eligibleItems(state, catalog)[0] : undefined; const guide = first ? { ...makeCrop(0, first.id, Date.now(), target, .5, w.season), plantedAt: Date.now() - DEMO_DURATION - 1000 } : undefined; commit({ ...w, mode: target, [target]: reduceFarm(state, { type: "ENTER", guide }, catalog) }); }
  function setSeasonMode(mode: SeasonMode, season?: Season) { const w = current.current; const nextSeason = mode === "auto" ? seasonForDate() : (season ?? w.season); commit({ ...w, seasonMode: mode, season: nextSeason, welcomeSeason: nextSeason }); }
  function plant(plot: number) {
    const w = current.current, state = w[w.mode], catalog = w.mode === "demo" ? demoItems : w.favoritePool;
    if (state.crops.some(c => c.plot === plot)) return;
    let eligible = eligibleItems(state, catalog);
    if (!eligible.length) { dispatch({ type: "NEXT_ROUND" }); const refreshed = current.current; eligible = eligibleItems(refreshed[refreshed.mode], catalog); }
    if (!eligible.length) { setNotice(catalog.length ? "这些收藏已种下或已收获。" : "当前没有可用于农场的收藏。"); return; }
    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    const starterFamily = w.mode === "personal" && state.plantedCount < 3 ? (state.starterFamily ?? seasonalFamilies(w.season)[0]) : undefined;
    if (dispatch({ type: "PLANT", crop: makeCrop(plot, chosen.id, Date.now(), w.mode, Math.random(), w.season, starterFamily) })) { setEvent({ type: "PLANT", plot, at: Date.now() }); setNotice("种好啦！这段回忆来自「" + chosen.favlist + "」。"); }
  }
  function care(id: string) { const crop = current.current[current.current.mode].crops.find(c => c.id === id); if (crop && dispatch({ type: "CARE", id, now: Date.now() })) { setEvent({ type: "CARE", plot: crop.plot, at: Date.now() }); setNotice("水浇好啦，早一点见面。"); } }
  function uproot(id: string) { const crop = current.current[current.current.mode].crops.find(c => c.id === id); dispatch({ type: "UPROOT", id }); if (crop) setEvent({ type: "UPROOT", plot: crop.plot, at: Date.now() }); }
  function harvest(id: string) {
    const w = current.current, crop = w[w.mode].crops.find(c => c.id === id), catalog = w.mode === "demo" ? demoItems : w.favoritePool, item = catalog.find(i => i.id === crop?.itemId);
    if (!crop || !item || stageOf(crop, Date.now()) !== "mature") return false;
    const popup = window.open("about:blank", "_blank");
    if (!popup) { setNotice("浏览器拦截了新标签页，请允许弹窗后再试。"); return false; }
    try { popup.opener = null; popup.location.href = item.url; } catch { popup.close(); return false; }
    dispatch({ type: "HARVEST", id, now: Date.now() });
    const harvestedWorkspace = current.current;
    triggerMemorial(harvestedWorkspace, harvestedWorkspace[harvestedWorkspace.mode], crop.assetFamily);
    if (w.mode === "personal") commit({ ...current.current, consumedUrls: [...new Set([...current.current.consumedUrls, item.url])] });
    setEvent({ type: "HARVEST", plot: crop.plot, at: Date.now() }); setNotice(w.mode === "demo" ? "体验收获 +1。" : "重温 +1。原帖已打开。"); return true;
  }
  function importCollections() { setNotice("个人收藏由知乎同步提供。"); return 0; }
  function reset(mode: Mode) { saveBlocked.current = false; const prefix = mode + ":" + (mode === "personal" ? (accountId.current ?? "") : "demo") + ":"; for (const key of [...memorialPending.current]) if (key.startsWith(prefix)) memorialPending.current.delete(key); commit({ ...current.current, [mode]: emptyFarm(mode === "demo" ? demoItems : current.current.personalItems) }); }
  function exportSave() {}
  function restoreSave() {}
  function login() { window.location.href = "/api/auth/zhihu?returnTo=personal"; }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); accountId.current = null; setAuth({ authenticated: false }); commit({ ...current.current, mode: "demo", demo: { ...current.current.demo, entered: false } }, false); setNotice("已退出知乎账号。"); }
  function switchMode(target: Mode) { if (target === "personal" && !auth?.authenticated) { login(); return; } commit({ ...current.current, mode: target }); }
  return { ready, now, mode, farm, items, workspace, season: workspace.season, seasonMode: workspace.seasonMode, event, memorial, clearMemorial: () => setMemorial(null), notice, storageWarning, auth, favlistsLoading, favlistsError, syncProgress, start, plant, care, uproot, harvest, importCollections, reset, exportSave, restoreSave, switchMode, login, logout, dispatch, getChatSnapshot, setNotice, setSeasonMode };
}

