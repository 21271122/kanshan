"use client";
import { useEffect, useState } from "react";
import { ContentItem, Crop, FarmState, Mode, growthOf, remainingMs, roundProgress, stageOf } from "../../lib/farm/model";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
import { AssetImage, CropDrawing, zones } from "./scene";
import { cropFamilies, cropFamilyName } from "../../lib/farm/crop-families";
import { assetForCrop } from "../../lib/farm-assets";
import type { useFarm } from "./use-farm";
export type FarmController = ReturnType<typeof useFarm>;

export function CropPanel({ crop, item, now, mode, onClose, onCare, onUproot, onHarvest }: { crop: Crop; item: ContentItem; now: number; mode: Mode; onClose: () => void; onCare: () => void; onUproot: () => void; onHarvest: () => boolean }) {
  const stage = stageOf(crop, now), mature = stage === "mature";
  const seconds = Math.ceil(remainingMs(crop, now) / 1000);
  const [confirmUproot, setConfirmUproot] = useState(false), [openError, setOpenError] = useState(false);
  return <Dialog title={mature ? "一段回忆，长好了" : stage === "sprout" ? "有些线索冒出了头" : "让故事先发一会儿芽"} eyebrow={String(crop.plot + 1).padStart(2, "0") + " 号地 · " + (mature ? "收获预览" : "刘看山正在照料")} onClose={onClose}>
    <div className={"crop-preview crop-preview-illustration preview-" + stage}><AssetImage asset={assetForCrop(crop.assetFamily, stage)} fallback={<CropDrawing stage={stage} />} /><span>{cropFamilyName(crop.assetFamily)} · {mature ? "成熟" : stage === "sprout" ? "生长" : "种植"}</span></div>
    <p className="source-line"><Icon name="folder" />来自「{item.favlist}」</p>
    <h3 className="memory-title">{mature ? item.title : stage === "sprout" ? item.hint : "完整故事还藏在土里。"}</h3>
    {stage !== "seed" && <div className="tags"><span>{item.type}</span>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
    {!mature ? <><div className="growth-track" role="progressbar" aria-label="成长进度" aria-valuenow={Math.round(growthOf(crop, now) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: "scaleX(" + growthOf(crop, now) + ")" }} /></div><p className="muted timer"><Icon name="clock" />约 {seconds >= 60 ? Math.ceil(seconds / 60) + " 分钟" : seconds + " 秒"}后成熟{mode === "demo" ? " · 演示节奏" : ""}</p>
      <button className="primary full" onClick={onCare} disabled={crop.caredAt !== undefined}><Icon name={crop.caredAt !== undefined ? "check" : "water"} />{crop.caredAt !== undefined ? "已经浇过水了，交给看山吧" : "浇一点水 · 早一点见面"}</button>
      <p className="fine-print">每株可浇水一次，缩短约 10% 生长时间。不照料也会成熟。</p>
      {confirmUproot ? <div className="inline-confirm"><p>收回作物后，这篇收藏会回到待重温池。</p><button className="secondary" onClick={onUproot}>确认收回</button><button className="quiet" onClick={() => setConfirmUproot(false)}>再等等</button></div> : <button className="quiet full" onClick={() => setConfirmUproot(true)}><Icon name="shovel" />收回这株作物</button>}
    </> : <><p className="memory-note">这是你曾经留下的一小片心意。想读多少，都由你。</p>{mode === "demo" && <p className="demo-note">这是一篇演示收藏，打开后会在知乎搜索同名话题。</p>}{openError && <p className="form-error" role="alert">浏览器未能打开新标签页。请允许本站弹窗后再试，作物仍为你保留。</p>}<button className="primary full" onClick={() => setOpenError(!onHarvest())}><Icon name="external" />{mode === "demo" ? "体验收获 · 搜索这个话题" : "收获 · 在知乎打开原帖"}</button><button className="quiet full" onClick={onClose}>先留在农场</button><p className="fine-print">打开新标签页后才计入收获，预览不会改变进度。</p></>}
  </Dialog>;
}
export function SourcePanel({ game, onClose, importFirst = false }: { game: FarmController; onClose: () => void; importFirst?: boolean }) {
  const [singleTitle, setSingleTitle] = useState(""), [singleUrl, setSingleUrl] = useState(""), [singleSource, setSingleSource] = useState("我的旧收藏");
  const [draft, setDraft] = useState(game.farm.sources), [tab, setTab] = useState(importFirst ? "import" : "sources"), [text, setText] = useState(""), [error, setError] = useState("");
  const [remoteSources, setRemoteSources] = useState<{token:string;title:string;description:string;isPublic:boolean;count?:number;contents?:any[]}[]>([]), [remoteLoading, setRemoteLoading] = useState(false), [remoteError, setRemoteError] = useState("");
  useEffect(() => {
    if (!game.auth?.authenticated || game.mode !== "personal") return;
    let cancelled = false;
    const refresh = () => { setRemoteLoading(true); setRemoteError(""); fetch("/api/favlists").then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "知乎收藏夹读取失败"); return data; }).then(data => { if (cancelled) return; setRemoteSources(data.items || []); }).catch(e => { if (!cancelled) setRemoteError(e instanceof Error ? e.message : "知乎收藏夹读取失败"); }).finally(() => { if (!cancelled) setRemoteLoading(false); }); };
    refresh(); const timer = window.setInterval(refresh, 5 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [game.auth?.authenticated, game.mode]);
  const sources = remoteSources.length ? remoteSources.map(x => x.title) : [...new Set(game.items.map(i => i.favlist))];
  function doImport(value = text) { try { if (!game.auth?.authenticated) { window.location.href = "/api/auth/zhihu?returnTo=personal"; return; } game.importCollections(value); game.start("personal"); onClose(); } catch (e) { setError(e instanceof Error ? e.message : "导入失败，请检查文件格式。"); } }
  return <Dialog title="想从哪里，重新遇见？" eyebrow="内容来源" onClose={onClose}>
    <div className="segmented" role="group" aria-label="来源操作"><button aria-pressed={tab === "sources"} onClick={() => setTab("sources")}>我的收藏夹</button><button aria-pressed={tab === "import"} onClick={() => setTab("import")}>导入旧收藏</button></div>
    {tab === "sources" ? <><p className="muted">你决定范围，看山挑选惊喜。已种下的作物会保留原来源。</p><div className="source-list">{remoteLoading && <p className="muted">正在从知乎读取你的收藏夹…</p>}{remoteError && <p className="form-error" role="alert">{remoteError}</p>}{sources.map(source => <label key={source}><input type="checkbox" checked={draft.includes(source)} onChange={() => setDraft(old => old.includes(source) ? old.filter(s => s !== source) : [...old, source])} /><span className="folder-icon"><Icon name="folder" /></span><span><strong>{source}</strong><small>{(() => { const remote = remoteSources.find(x => x.title === source); return remote?.count === null ? "读取失败" : (remote?.count ?? game.items.filter(i => i.favlist === source).length) + " 篇"; })()} · {game.mode === "demo" ? "演示收藏" : "知乎收藏夹"}</small></span></label>)}</div>{!sources.length && <p className="empty-state">这里还没有收藏。导入一篇喜欢的旧内容，让它重新长出来。</p>}<button className="primary full" disabled={!draft.length} onClick={() => { const selected = remoteSources.filter(x => draft.includes(x.title)).flatMap(x => x.contents || []); if (selected.length) { try { game.importCollections(JSON.stringify(selected)); } catch (e) { setError(e instanceof Error ? e.message : "收藏夹内容导入失败"); return; } } game.dispatch({ type: "SOURCES", sources: draft }); game.setNotice("来源已更新，已将所选收藏夹加入抽取池。"); onClose(); }}>就从这些收藏里开始 <Icon name="arrow" /></button><p className="fine-print">当前为{game.mode === "demo" ? "演示" : "个人"}农场 · 数据保存在此浏览器</p></> : <>
      <p className="muted">粘贴收藏的标题和原帖链接，即可在个人农场重温。只保留元数据，不导入正文。</p>
      <div className="single-import"><label className="input-label" htmlFor="memory-title">收藏标题</label><input id="memory-title" className="text-input" value={singleTitle} onChange={e => setSingleTitle(e.target.value)} placeholder="曾经想再读一次的那篇内容" maxLength={200}/><label className="input-label" htmlFor="memory-url">知乎原帖链接</label><input id="memory-url" className="text-input" type="url" value={singleUrl} onChange={e => setSingleUrl(e.target.value)} placeholder="粘贴回答或文章链接"/><label className="input-label" htmlFor="memory-source">放进哪个收藏夹</label><input id="memory-source" className="text-input" value={singleSource} onChange={e => setSingleSource(e.target.value)} maxLength={80}/><button className="primary full import-single" disabled={!singleTitle.trim() || !singleUrl.trim()} onClick={() => doImport(JSON.stringify([{ title: singleTitle, url: singleUrl, favlist: singleSource }]))}>带它回到农场 <Icon name="arrow"/></button></div><details className="batch-import"><summary>批量导入已有收藏文件</summary><label className="input-label" htmlFor="collection-json">收藏元数据（JSON 数组）</label>
      <textarea id="collection-json" value={text} onChange={e => { setText(e.target.value); setError(""); }} spellCheck={false} placeholder={'[\n  {\n    "title": "你收藏的标题",\n    "url": "知乎回答或文章的完整 HTTPS 链接",\n    "favlist": "想再读一遍"\n  }\n]'} />
      <label className="file-button"><Icon name="folder" />选择 JSON 文件<input type="file" accept=".json,application/json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 1_000_000) { setError("文件请控制在 1 MB 以内。"); return; } try { setText(await file.text()); setError(""); } catch { setError("未能读取文件，请尝试粘贴内容。"); } }} /></label>
      <p className="fine-print">必填 title、url；可选 favlist、hint、tags。重复原帖自动合并，每次最多 2000 篇。</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary full" disabled={!text.trim()} onClick={() => doImport()}>导入并进入个人农场 <Icon name="arrow" /></button>
      </details>{error && <p role="alert" className="form-error">{error}</p>}<p className="demo-note">知乎收藏夹已读取；农场状态保存在此浏览器，演示存档单独保留。</p>
    </>}
  </Dialog>;
}
export function LogPanel({ farm, items, mode, now, onClose, onNewRound }: { farm: FarmState; items: ContentItem[]; mode: Mode; now: number; onClose: () => void; onNewRound: () => void }) {
  const progress = roundProgress(farm, items);
  const caredDays = farm.gardenSince ? Math.min(7, Math.floor((now - farm.gardenSince) / 86_400_000)) : 0;
  return <Dialog title="那些，又遇见的瞬间" eyebrow="收获记录" onClose={onClose} wide>
    <div className="log-summary"><div><b>{farm.log.length}</b><span>{mode === "demo" ? "次体验收获" : "次重新遇见"}</span></div><p>第 {farm.round} 轮 <strong>{progress.count} / {progress.total}</strong><span>已重温所选收藏</span></p></div>
    <div className="achievements" aria-label="回味印记">{[{ active: farm.achievements.includes("first") || farm.log.length >= 1, title: "初次回味", desc: "重温第 1 篇" }, { active: farm.achievements.includes("first") || farm.log.length >= 10, title: "十次相遇", desc: "累计重温 10 篇" }, { active: farm.achievements.includes("caretaker") || caredDays >= 7, title: "看山照料者", desc: farm.achievements.includes("caretaker") ? "已托管满 7 天" : "连续托管 " + caredDays + "/7 天" }].map(badge => <div key={badge.title} className={badge.active ? "earned" : ""}><Icon name={badge.active ? "spark" : "leaf"} /><strong>{badge.title}</strong><small>{badge.desc}</small></div>)}</div>
    {progress.complete && <div className="round-complete"><Icon name="check" /><p>这一轮的收藏，都见过面啦。<small>新一轮重新随机，收获记录会保留。</small></p><button className="secondary" onClick={onNewRound}>开启新一轮</button></div>}
    {!farm.log.length ? <div className="empty-state"><Icon name="book" /><h3>等第一段回忆落在这里</h3><p>农场里有一颗成熟果实，打开它，就留下第一次相遇。</p><button className="secondary" onClick={onClose}>回农场看看</button></div> : <ol className="harvest-list">{farm.log.map(entry => <li key={entry.id}><div className="log-mark"><Icon name="leaf" /></div><div><h3>{entry.item.title}</h3><p>{entry.item.favlist} · {entry.at === null ? "旧存档 · 日期未记录" : new Date(entry.at).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><a href={entry.item.url} target="_blank" rel="noreferrer">{mode === "demo" ? "再看看这个话题" : "再读一遍"}<Icon name="external" /></a></div></li>)}</ol>}
  </Dialog>;
}
export function HelpPanel({ onClose }: { onClose: () => void }) {
  return <Dialog title="来这里，不用赶时间" eyebrow="看山的农场小手册" onClose={onClose}><div className="help-steps">{[{ icon: "folder" as const, title: "选好回忆的来处", text: "勾选收藏夹，或导入以前存下的知乎回答和文章。" }, { icon: "leaf" as const, title: "空地一按，种下惊喜", text: "随机挑一篇未重温的收藏，发芽后会慢慢透露线索。" }, { icon: "spark" as const, title: "长好了，再见一面", text: "点击成熟果实预览。打开原帖才计入收获，不要求读完。" }].map(step => <div key={step.title}><span><Icon name={step.icon} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="season-plants" aria-label="秋季五种植物">{cropFamilies.map(family => <figure key={family.id}><AssetImage asset={assetForCrop(family.id, "mature")} fallback={<CropDrawing stage="mature"/>}/><figcaption>{family.name}</figcaption></figure>)}</div><p className="fine-print">每次播种随机遇见一种秋季植物。植物的外观不会改变收藏抽取概率；同一株的品种会一直保留到收获。</p><div className="gentle-note"><Icon name="water" /><p>你不在的时候，看山也会照料。<br/>没有枯萎、打卡或错过奖励。</p></div><p className="fine-print">演示作物约 80 秒成熟；个人农场约 10 分钟。一次浇水可缩短约 10%，关闭页面也会继续成长。</p></Dialog>;
}
export function MapPanel({ onClose }: { onClose: () => void }) {
  return <Dialog title="沃野的远处，还有风景" eyebrow="农场地图" onClose={onClose}><div className="mini-map"><Icon name="map" /><span>山在远处，田在脚下</span></div><div className="zone-list">{zones.map(zone => <div key={zone.id}><Icon name={zone.unlocked ? "leaf" : "lock"} /><span><strong>{zone.name}</strong><small>{zone.unlocked ? zone.plotCount + " 块地 · 正在照料" : "未来区域 · 暂未开放"}</small></span>{zone.unlocked && <span className="tag">当前</span>}</div>)}</div><p className="fine-print">现在先照顾好这十块地。未来的新区域会单独切换，不会挤占这片农场。</p></Dialog>;
}
export function SettingsPanel({ game, onClose }: { game: FarmController; onClose: () => void }) {
  const [eraseImportedItems, setEraseImportedItems] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false), [error, setError] = useState(""), [backup, setBackup] = useState("");
  return <Dialog title="按自己的节奏来" eyebrow="农场设置" onClose={onClose}>
    <div className="setting-row"><div><strong>当前农场</strong><small>{game.mode === "demo" ? "演示收藏 · 独立存档" : "个人收藏 · 本地存档"}</small></div><button className="secondary" onClick={() => { game.switchMode(game.mode === "demo" ? "personal" : "demo"); onClose(); }}>切换到{game.mode === "demo" ? "个人" : "演示"}</button></div>
    {game.mode === "demo" && <div className="setting-row"><div><strong>演示时间</strong><small>让地里的作物快进 40 秒</small></div><button className="secondary" disabled={!game.farm.crops.length} onClick={() => { game.dispatch({ type: "ADVANCE", milliseconds: 40_000 }); game.setNotice("演示时间已前进 40 秒。"); onClose(); }}><Icon name="clock" />快进</button></div>}
    <div className="setting-row"><div><strong>备份农场</strong><small>导出本地记录，方便恢复</small></div><button className="secondary" onClick={game.exportSave}><Icon name="download" />导出备份</button></div>
    <label className="file-button"><Icon name="folder" />选择农场备份<input type="file" accept=".json,application/json" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 10_000_000) { setError("备份过大，请选择 10 MB 以内的文件。"); return; } try { setBackup(await f.text()); setError(""); } catch { setError("备份未能读取。"); } }} /></label>
    {backup && <div className="inline-confirm"><p>恢复将替换当前浏览器内的两座农场。建议先导出备份。</p><button className="secondary" onClick={() => { try { game.restoreSave(backup); onClose(); } catch { setError("这不是有效的 V2 农场备份，原存档没有改动。"); } }}>确认恢复备份</button><button className="quiet" onClick={() => setBackup("")}>取消</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <p className="fine-print">动画跟随系统的“减少动态效果”设置。知乎登录已接通；农场状态保存在此浏览器，跨设备同步尚未接入。</p>
    {confirmReset ? <div className="inline-confirm"><p>清除当前{game.mode === "demo" ? "演示" : "个人"}农场的作物与收获记录？导入的收藏默认保留。</p>{game.mode === "personal" && <label className="erase-option"><input type="checkbox" checked={eraseImportedItems} onChange={e => setEraseImportedItems(e.target.checked)}/>同时移除本机导入的收藏（不影响知乎）</label>}<button className="danger-button" onClick={() => { game.reset(game.mode, eraseImportedItems); onClose(); }}>确认清除当前农场</button><button className="quiet" onClick={() => setConfirmReset(false)}>保留</button></div> : <button className="quiet danger-text" onClick={() => setConfirmReset(true)}>清除当前农场记录</button>}
  </Dialog>;
}









