"use client";
import { useEffect, useState } from "react";
import { ContentItem, Crop, FarmState, Mode, growthOf, memorialFamilyKey, remainingMs, roundProgress, stageOf } from "../../lib/farm/model";
import { Dialog } from "./dialog";
import { Icon } from "./icon";
import { AssetImage, CropDrawing, zones } from "./scene";
import { assetForCrop } from "../../lib/farm-assets";
import type { useFarm } from "./use-farm";
export type FarmController = ReturnType<typeof useFarm>;

export function CropPanel({ crop, item, now, mode, onClose, onCare, onUproot, onHarvest }: { crop: Crop; item: ContentItem; now: number; mode: Mode; onClose: () => void; onCare: () => void; onUproot: () => void; onHarvest: () => boolean }) {
  const stage = stageOf(crop, now), mature = stage === "mature";
  const seconds = Math.ceil(remainingMs(crop, now) / 1000);
  const [confirmUproot, setConfirmUproot] = useState(false), [openError, setOpenError] = useState(false);
  return <Dialog title={mature ? "一段回忆，长好了" : stage === "sprout" ? "有些线索冒出了头" : "让故事先发一会儿芽"} eyebrow={String(crop.plot + 1).padStart(2, "0") + " 号地 · " + (mature ? "收获预览" : "刘看山正在照料")} onClose={onClose}>
    <div className={"crop-preview crop-preview-illustration preview-" + stage}><AssetImage asset={assetForCrop(crop.assetFamily, stage)} fallback={<CropDrawing stage={stage} />} /><span>{mature ? "成熟" : stage === "sprout" ? "生长" : "种植"}</span></div>
    <p className="source-line"><Icon name="folder" />来自「{item.favlist}」</p>
    <h3 className="memory-title">{mature ? item.title : stage === "sprout" ? item.hint : "完整故事还藏在土里。"}</h3>
    {stage !== "seed" && <div className="tags"><span>{item.type}</span>{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
    {!mature ? <><div className="growth-track" role="progressbar" aria-label="成长进度" aria-valuenow={Math.round(growthOf(crop, now) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: "scaleX(" + growthOf(crop, now) + ")" }} /></div><p className="muted timer"><Icon name="clock" />约 {seconds >= 60 ? Math.ceil(seconds / 60) + " 分钟" : seconds + " 秒"}后成熟{mode === "demo" ? " · 演示节奏" : ""}</p>
      <button className="primary full" onClick={onCare} disabled={crop.caredAt !== undefined}><Icon name={crop.caredAt !== undefined ? "check" : "water"} />{crop.caredAt !== undefined ? "已经施过肥了" : "施肥 · 立即收获"}</button>
      <p className="fine-print">每株只能施肥一次。施肥会让它立刻成熟，然后就可以收获。不施肥也会自然生长。</p>
      {confirmUproot ? <div className="inline-confirm"><p>收回作物后，这篇收藏会回到待重温池。</p><button className="secondary" onClick={onUproot}>确认收回</button><button className="quiet" onClick={() => setConfirmUproot(false)}>再等等</button></div> : <button className="quiet full" onClick={() => setConfirmUproot(true)}><Icon name="shovel" />收回这株作物</button>}
    </> : <><p className="memory-note">这是你曾经留下的一小片心意。想读多少，都由你。</p>{openError && <p className="form-error" role="alert">浏览器未能打开新标签页。请允许本站弹窗后再试，作物仍为你保留。</p>}<button className="primary full" onClick={() => setOpenError(!onHarvest())}><Icon name="external" />{mode === "demo" ? "体验收获 · 搜索这个话题" : "收获 · 在知乎打开原帖"}</button></>}
  </Dialog>;
}
export function SourcePanel({ game, onClose }: { game: FarmController; onClose: () => void }) {
  const sources = game.workspace.favoriteFolders.length ? game.workspace.favoriteFolders.map(f => f.title) : [...new Set(game.items.map(i => i.favlist))];
  const [draft, setDraft] = useState(game.farm.sources.length ? game.farm.sources : sources);
  return <Dialog title="想从哪里，重新遇见？" eyebrow="内容来源" onClose={onClose}>
    <p className="muted">默认选中全部收藏夹。你决定范围，看山挑选惊喜。</p>
    {game.favlistsLoading && <p className="muted">正在从知乎读取你的收藏夹…</p>}
    {game.favlistsError && <p className="form-error" role="alert">{game.favlistsError}</p>}
    <div className="source-list">{sources.map(source => <label key={source}><input type="checkbox" checked={draft.includes(source)} onChange={() => setDraft(old => old.includes(source) ? old.filter(s => s !== source) : [...old, source])}/><span className="folder-icon"><Icon name="folder"/></span><span><strong>{source}</strong><small>{game.workspace.favoritePool.filter(i => i.favlist === source).length} 篇 · {game.mode === "demo" ? "演示收藏" : "知乎收藏夹"}</small></span></label>)}</div>
    {!sources.length && <p className="empty-state">还没有可用于农场的收藏。先在知乎收藏一些喜欢的内容吧。</p>}
    <button className="primary full" disabled={!draft.length || game.favlistsLoading} onClick={() => { game.dispatch({ type: "SOURCES", sources: draft }); game.setNotice("来源已更新，已种下的作物会保留。"); onClose(); }}>就从这些收藏里开始 <Icon name="arrow"/></button>
    
  </Dialog>;
}
export function LogPanel({ farm, items, mode, now, onClose, onNewRound }: { farm: FarmState; items: ContentItem[]; mode: Mode; now: number; onClose: () => void; onNewRound: () => void }) {
  const progress = roundProgress(farm, items);
  const caredDays = farm.gardenSince ? Math.min(7, Math.floor((now - farm.gardenSince) / 86_400_000)) : 0;
  return <Dialog title="那些，又遇见的瞬间" eyebrow="收获记录" onClose={onClose} wide>
    <div className="log-summary"><div><b>{farm.log.length}</b><span>{mode === "demo" ? "次体验收获" : "次重新遇见"}</span></div></div>
    <div className="achievements" aria-label="回味印记">{[{ active: farm.achievements.includes("first") || farm.log.length >= 1, title: "初次回味", desc: "重温第 1 篇" }, { active: farm.achievements.includes("first") || farm.log.length >= 10, title: "十次相遇", desc: "累计重温 10 篇" }, { active: farm.achievements.includes("caretaker") || caredDays >= 7, title: "看山照料者", desc: farm.achievements.includes("caretaker") ? "已托管满 7 天" : "连续托管 " + caredDays + "/7 天" }].map(badge => <div key={badge.title} className={badge.active ? "earned" : ""}><Icon name={badge.active ? "spark" : "leaf"} /><strong>{badge.title}</strong><small>{badge.desc}</small></div>)}</div>
    {!farm.log.length ? <div className="empty-state"><Icon name="book" /><h3>等第一段回忆落在这里</h3><p>农场里有一颗成熟果实，打开它，就留下第一次相遇。</p><button className="secondary" onClick={onClose}>回农场看看</button></div> : <ol className="harvest-list">{farm.log.map(entry => <li key={entry.id}><div className="log-mark"><Icon name="leaf" /></div><div><h3>{entry.item.title}</h3><p>{entry.item.favlist} · {entry.at === null ? "旧存档 · 日期未记录" : new Date(entry.at).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p><a href={entry.item.url} target="_blank" rel="noreferrer">{mode === "demo" ? "再看看这个话题" : "再读一遍"}<Icon name="external" /></a></div></li>)}</ol>}
  </Dialog>;
}
export function HelpPanel({ onClose }: { onClose: () => void }) {
  return <Dialog title="来这里，不用赶时间" eyebrow="看山的农场小手册" onClose={onClose}><div className="help-steps">{[{ icon: "folder" as const, title: "选好回忆的来处", text: "登录知乎后自动读取收藏夹，默认全部选中。" }, { icon: "leaf" as const, title: "空地一按，种下惊喜", text: "随机挑一篇未重温的收藏，发芽后会慢慢透露线索。" }, { icon: "spark" as const, title: "长好了，再见一面", text: "点击成熟果实预览。打开原帖才计入收获，不要求读完。" }].map(step => <div key={step.title}><span><Icon name={step.icon} /></span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="gentle-note"><Icon name="water" /><p>你不在的时候，看山也会照料。<br/>没有枯萎、打卡或错过奖励。</p></div></Dialog>;
}
export function AchievementPanel({ farm, onClose }: { farm: FarmState; onClose: () => void }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const varieties = [{name:"小白菜",family:"autumn-cabbage",img:"/assets/farm/crops/autumn-cabbage/mature.png"},{name:"樱桃萝卜",family:"autumn-radish",img:"/assets/farm/crops/autumn-radish/mature.png"},{name:"牵牛花",family:"autumn-morning-glory",img:"/assets/farm/crops/autumn-morning-glory/mature.png"},{name:"花椰菜",family:"autumn-cauliflower",img:"/assets/farm/crops/autumn-cauliflower/mature.png"},{name:"葡萄",family:"autumn-grape",img:"/assets/farm/crops/autumn-grape/mature.png"},{name:"菠菜",family:"spring-spinach",img:"/assets/farm/crops/spring-spinach/mature.png"},{name:"草莓",family:"spring-strawberry",img:"/assets/farm/crops/spring-strawberry/mature.png"},{name:"三色堇",family:"spring-pansy",img:"/assets/farm/crops/spring-pansy/mature.png"},{name:"西红柿",family:"spring-tomato",img:"/assets/farm/crops/spring-tomato/mature.png"},{name:"豌豆苗",family:"spring-pea-shoot",img:"/assets/farm/crops/spring-pea-shoot/mature.png"}];
  const harvestCounts = new Map<string, number>();
  for (const entry of farm.log) {
    const key = memorialFamilyKey(entry.assetFamily);
    harvestCounts.set(key, (harvestCounts.get(key) ?? 0) + 1);
  }
  return <Dialog title="每一次收获，都有新发现" eyebrow="作物图鉴" onClose={onClose} wide><p className="muted">收获一次即可点亮作物；累计收获三次后，才可翻转查看种植纪念。</p><div className="achievement-gallery">{varieties.map(v => { const key = memorialFamilyKey(v.family); const harvestCount = harvestCounts.get(key) ?? 0; const earned = harvestCount > 0; const memorialReady = harvestCount >= 3 && farm.achievements.includes("memorial:" + key); const isFlipped = memorialReady && !!flipped[v.family]; const sticker = memorialStickers[v.family]; return <div key={v.family} className={"achievement-card sticker-card " + (earned ? "earned" : "locked")}><button type="button" className={"sticker-flip " + (isFlipped ? "is-flipped " : "") + (earned && !memorialReady ? "memorial-locked" : "")} disabled={!memorialReady} aria-label={memorialReady ? (isFlipped ? "查看" + v.name + "成熟图" : "查看" + v.name + "种植纪念") : earned ? v.name + "已点亮，累计收获" + harvestCount + "次，收获3次后可查看纪念" : v.name + "尚未解锁"} aria-pressed={memorialReady && isFlipped} onClick={() => memorialReady && setFlipped(old => ({ ...old, [v.family]: !old[v.family] }))}><span className="sticker-face sticker-front"><img src={v.img} alt={v.name + "成熟图"}/></span><span className="sticker-face sticker-back"><img src={sticker?.src ?? v.img} alt={v.name + "种植纪念贴图"}/></span>{!earned && <span className="sticker-mask"><Icon name="lock"/></span>}</button><strong>{v.name}</strong><small>{memorialReady ? (isFlipped ? "种植纪念 · 点击翻回" : "累计3次 · 点击查看纪念") : earned ? "已点亮 · 已收获" + harvestCount + "/3 次" : "收获后解锁"}</small></div>})}</div></Dialog>;
}
const memorialStickers: Record<string, { name: string; src: string }> = {
  "autumn-cabbage": { name: "小白菜", src: "/assets/farm/stickers/autumn-cabbage.png" },
  "autumn-radish": { name: "樱桃萝卜", src: "/assets/farm/stickers/autumn-radish.png" },
  "autumn-morning-glory": { name: "牵牛花", src: "/assets/farm/stickers/autumn-morning-glory.png" },
  "autumn-cauliflower": { name: "花椰菜", src: "/assets/farm/stickers/autumn-cauliflower.png" },
  "autumn-grape": { name: "葡萄", src: "/assets/farm/stickers/autumn-grape.png" },
  "autumn-pea-shoot": { name: "豌豆苗", src: "/assets/farm/stickers/autumn-pea-shoot.png" },
  "spring-spinach": { name: "菠菜", src: "/assets/farm/stickers/spring-spinach.png" },
  "spring-strawberry": { name: "草莓", src: "/assets/farm/stickers/spring-strawberry.png" },
  "spring-pansy": { name: "三色堇", src: "/assets/farm/stickers/spring-pansy.png" },
  "spring-tomato": { name: "西红柿", src: "/assets/farm/stickers/spring-tomato.png" },
  "spring-pea-shoot": { name: "豌豆苗", src: "/assets/farm/stickers/spring-pea-shoot.png" },
  cabbage: { name: "小白菜", src: "/assets/farm/stickers/autumn-cabbage.png" },
  radish: { name: "樱桃萝卜", src: "/assets/farm/stickers/autumn-radish.png" },
  morningGlory: { name: "牵牛花", src: "/assets/farm/stickers/autumn-morning-glory.png" },
  cauliflower: { name: "花椰菜", src: "/assets/farm/stickers/autumn-cauliflower.png" },
  grape: { name: "葡萄", src: "/assets/farm/stickers/autumn-grape.png" },
  peaShoots: { name: "豌豆苗", src: "/assets/farm/stickers/autumn-pea-shoot.png" },
};
export function PlantingMemorialPanel({ memorial, onClose }: { memorial: { family: string; season: "autumn" | "spring" }; onClose: () => void }) {
  const sticker = memorialStickers[memorial.family] ?? memorialStickers[memorial.season === "spring" ? "spring-spinach" : "autumn-cabbage"];
  return <Dialog title="种植纪念" eyebrow="隐藏彩蛋 · 三次收获" onClose={onClose}><div className="memorial-art"><img src={sticker.src} alt={sticker.name + "种植纪念贴图"} /></div><h3 className="memory-title memorial-title">恭喜你，收获了 3 株{sticker.name}</h3><p className="memory-note">一小片种下的心意，长成了值得收藏的纪念。图鉴已为你点亮。</p><button className="primary full" onClick={onClose}>收下这份纪念</button></Dialog>;
}

export function SettingsPanel({ game, onClose }: { game: FarmController; onClose: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return <Dialog title="按自己的节奏来" eyebrow="农场设置" onClose={onClose}>
    {game.mode === "demo" && <div className="setting-row"><div><strong>演示时间</strong><small>让地里的作物快进 40 秒</small></div><button className="secondary" disabled={!game.farm.crops.length} onClick={() => { game.dispatch({ type: "ADVANCE", milliseconds: 40_000 }); game.setNotice("演示时间已前进 40 秒。"); onClose(); }}><Icon name="clock" />快进</button></div>}
    <div className="season-setting"><strong>季节</strong><small>自动模式按时间切换：3–8 月春季，9–2 月秋季。</small><div className="segmented"><button aria-pressed={game.seasonMode === "auto"} onClick={() => game.setSeasonMode("auto")}>自动切换</button><button aria-pressed={game.seasonMode === "manual"} onClick={() => game.setSeasonMode("manual")}>手动模式</button></div>{game.seasonMode === "manual" && <><button className="secondary full" onClick={() => game.setSeasonMode("manual", game.season === "spring" ? "autumn" : "spring")}>切换到{game.season === "spring" ? "秋季" : "春季"}</button><button className="quiet full" onClick={() => game.setSeasonMode("auto")}>回到自动切换季节</button></>}</div><p className="fine-print">农场状态保存在此浏览器，跨设备同步尚未接入。</p>
    {confirmReset ? <div className="inline-confirm"><p>清除当前{game.mode === "demo" ? "演示" : "个人"}农场的作物与收获记录？</p><button className="danger-button" onClick={() => { game.reset(game.mode); onClose(); }}>确认清除当前农场</button><button className="quiet" onClick={() => setConfirmReset(false)}>保留</button></div> : <button className="quiet danger-text" onClick={() => setConfirmReset(true)}>清除当前农场记录</button>}
  </Dialog>;
}

