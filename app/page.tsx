"use client";

import { useEffect, useMemo, useState } from "react";

type Stage = "seed" | "sprout" | "mature";
type Item = { id: string; favlist: string; title: string; hint: string; tags: string[]; url: string; type: string };
type Crop = { id: string; plot: number; itemId: string; plantedAt: number; careSeconds: number; guide?: boolean };
type FarmState = { sources: string[]; crops: Crop[]; reviewed: string[]; achievements: string[]; entered: boolean };

const KEY = "kanshan-woye-demo-v1";
const PLOTS = Array.from({ length: 10 }, (_, i) => i);
const SPROUT_AFTER = 35_000;
const MATURE_AFTER = 80_000;

const items: Item[] = [
  { id: "a1", favlist: "值得反复看的回答", title: "一个人如何建立稳定的内在秩序？", hint: "秩序 · 自我理解 · 长期", tags: ["成长", "思考"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a2", favlist: "值得反复看的回答", title: "你是从什么时候开始理解父母的？", hint: "家人 · 时间 · 体谅", tags: ["生活", "关系"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a3", favlist: "值得反复看的回答", title: "有哪些曾改变过你看待世界方式的句子？", hint: "语言 · 视角 · 感受", tags: ["阅读", "思考"], type: "回答", url: "https://www.zhihu.com" },
  { id: "a4", favlist: "值得反复看的回答", title: "普通人怎样做长期主义，才能不被耗尽？", hint: "耐心 · 节奏 · 长期", tags: ["成长", "职业"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b1", favlist: "灵感与创作", title: "做设计时，怎样保留那些看似无用的直觉？", hint: "创作 · 直觉 · 留白", tags: ["设计", "创作"], type: "文章", url: "https://www.zhihu.com" },
  { id: "b2", favlist: "灵感与创作", title: "如何判断一个好想法值得花时间？", hint: "想法 · 选择 · 行动", tags: ["创作", "方法"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b3", favlist: "灵感与创作", title: "为什么有些作品会让人想回头再看一遍？", hint: "作品 · 记忆 · 回望", tags: ["艺术", "创作"], type: "回答", url: "https://www.zhihu.com" },
  { id: "b4", favlist: "灵感与创作", title: "创作者如何度过没有反馈的日子？", hint: "创作 · 安静 · 坚持", tags: ["创作", "生活"], type: "文章", url: "https://www.zhihu.com" },
  { id: "c1", favlist: "关于城市的想象", title: "一座好城市，会怎样照顾独自生活的人？", hint: "城市 · 独处 · 日常", tags: ["城市", "生活"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c2", favlist: "关于城市的想象", title: "你住过最有烟火气的街区是什么样？", hint: "街道 · 人情 · 记忆", tags: ["城市", "旅行"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c3", favlist: "关于城市的想象", title: "为什么我们会怀念已经离开的地方？", hint: "离开 · 地方 · 回忆", tags: ["情感", "城市"], type: "回答", url: "https://www.zhihu.com" },
  { id: "c4", favlist: "关于城市的想象", title: "下雨天最适合去一座城市的哪里？", hint: "雨天 · 漫步 · 发现", tags: ["旅行", "生活"], type: "文章", url: "https://www.zhihu.com" },
];

const favlists = [...new Set(items.map((item) => item.favlist))];
const defaultState: FarmState = { sources: favlists.slice(0, 2), crops: [], reviewed: [], achievements: [], entered: false };

function stageOf(crop: Crop, now: number): Stage {
  const age = now - crop.plantedAt + crop.careSeconds * 1000;
  if (age >= MATURE_AFTER) return "mature";
  if (age >= SPROUT_AFTER) return "sprout";
  return "seed";
}

function makeGuideCrop(): Crop {
  return { id: "guide-crop", plot: 0, itemId: "a1", plantedAt: Date.now() - MATURE_AFTER - 2_000, careSeconds: 0, guide: true };
}

function Icon({ name }: { name: "leaf" | "water" | "shovel" | "spark" | "arrow" | "check" | "clock" | "seed" }) {
  const paths: Record<string, React.ReactNode> = {
    leaf: <path d="M20.6 3.4C12 3.7 5.3 7.6 4 14.1c-.7 3.4.8 5.7 2.1 6.5 1.1.7 2.1.4 2.3-.5.3-1.4-1.4-2-1.4-4.6 0-3.8 4.3-7.5 11.7-8.7-5.6 2.9-8.2 6.6-9 12.2-.2 1.1.5 1.8 1.3 1.9 1 .1 1.7-.6 1.9-1.4.5-2.6 1.9-6.5 7.5-10.4.9-.7 1.1-1.8.3-2.7Z" />,
    water: <path d="M12 2.8C8.5 7.5 5.6 10.9 5.6 14.5a6.4 6.4 0 0 0 12.8 0C18.4 10.9 15.5 7.5 12 2.8Zm0 15.7a4 4 0 0 1-4-4c0-1.7 1.1-3.7 4-7.7 2.9 4 4 6 4 7.7a4 4 0 0 1-4 4Z" />,
    shovel: <path d="m14.7 3.2 6.1 6.1-1.7 1.7-2-2L10.7 15.4l-2.1 5.4-5.1-5.1 5.4-2.1L15.3 7l-2.2-2.1 1.6-1.7ZM7.4 16.2l-.9.4 1 1 .4-.9-.5-.5Z" />,
    spark: <path d="M12 2.5 14.2 9l6.5 2.2-6.5 2.2-2.2 6.6-2.2-6.6-6.5-2.2L9.8 9 12 2.5Z" />,
    arrow: <path d="M13.3 5.3 20 12l-6.7 6.7-1.7-1.7 3.8-3.8H4v-2.4h11.4L11.6 7l1.7-1.7Z" />,
    check: <path d="m5 12.5 4.2 4.2L19.5 6.4l-1.7-1.7-8.6 8.6-2.5-2.5L5 12.5Z" />,
    clock: <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 14.6a6.1 6.1 0 1 1 0-12.2 6.1 6.1 0 0 1 0 12.2Zm1.2-10.2h-2.4v4.9l4.1 2.5 1.3-2-3-1.8V7.9Z" />,
    seed: <path d="M18.9 4.8C11.5 5.1 5 9.3 5 14.5c0 3.2 2.3 5.5 5.5 5.5 5.2 0 9.4-6.5 9.7-13.9.1-.8-.5-1.4-1.3-1.3Zm-8.4 12.8a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export default function Home() {
  const [farm, setFarm] = useState<FarmState>(defaultState);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showSources, setShowSources] = useState(false);
  const [showHarvest, setShowHarvest] = useState<Item | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved) {
      try { setFarm(JSON.parse(saved)); } catch { window.localStorage.removeItem(KEY); }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(KEY, JSON.stringify(farm));
  }, [farm, ready]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeItems = useMemo(() => items.filter((item) => farm.sources.includes(item.favlist)), [farm.sources]);
  const harvestedCount = farm.reviewed.filter((id) => activeItems.some((item) => item.id === id)).length;
  const cropAt = (plot: number) => farm.crops.find((crop) => crop.plot === plot);
  const itemFor = (crop: Crop) => items.find((item) => item.id === crop.itemId)!;

  function enterFarm() {
    setFarm((old) => old.entered ? old : { ...old, entered: true, crops: [makeGuideCrop()] });
  }
  function plant(plot: number) {
    const occupied = new Set(farm.crops.map((crop) => crop.itemId));
    const eligible = activeItems.filter((item) => !farm.reviewed.includes(item.id) && !occupied.has(item.id));
    if (!eligible.length) { setNotice("这一轮可种的收藏都已经在地里，或已经回顾过了。你可以收获、铲除，或开启新一轮。"); return; }
    const item = eligible[Math.floor(Math.random() * eligible.length)];
    setFarm((old) => ({ ...old, crops: [...old.crops, { id: crypto.randomUUID(), plot, itemId: item.id, plantedAt: Date.now(), careSeconds: 0 }] }));
    setSelectedPlot(null); setNotice(`刘看山从「${item.favlist}」里悄悄种下了一段回忆。`);
  }
  function care(crop: Crop) {
    setFarm((old) => ({ ...old, crops: old.crops.map((value) => value.id === crop.id ? { ...value, careSeconds: value.careSeconds + 18 } : value), achievements: old.achievements.includes("caretaker") ? old.achievements : [...old.achievements, "caretaker"] }));
    setNotice("浇水完成，成长时间缩短了 18 秒。刘看山记下了你的照料。");
  }
  function uproot(crop: Crop) {
    setFarm((old) => ({ ...old, crops: old.crops.filter((value) => value.id !== crop.id) }));
    setSelectedPlot(null); setNotice("作物已经铲除。对应收藏回到待重温池，以后仍可能再次被种下。");
  }
  function harvest(crop: Crop) {
    const item = itemFor(crop);
    setFarm((old) => {
      const achievements = [...old.achievements];
      if (!achievements.includes("first")) achievements.push("first");
      const count = new Set([...old.reviewed, item.id]).size;
      if (count >= 3 && !achievements.includes("three")) achievements.push("three");
      if (count >= 10 && !achievements.includes("ten")) achievements.push("ten");
      return { ...old, crops: old.crops.filter((value) => value.id !== crop.id), reviewed: [...new Set([...old.reviewed, item.id])], achievements };
    });
    setShowHarvest(item); setSelectedPlot(null);
  }
  function setSources(sources: string[]) { setFarm((old) => ({ ...old, sources })); }
  function speedUpDemo() {
    setFarm((old) => ({ ...old, crops: old.crops.map((crop) => ({ ...crop, plantedAt: crop.plantedAt - 50_000 })) }));
    setNotice("演示时间已前进一天：地里的作物长大了一些。真实版本按实际时间自动成熟。");
  }
  function newRound() {
    setFarm((old) => ({ ...old, crops: [], reviewed: [], achievements: old.achievements }));
    setNotice("新的回顾轮次已经开始。所有已回顾的收藏重新回到候选池。 ");
  }
  function resetDemo() { window.localStorage.removeItem(KEY); setFarm(defaultState); setNotice("演示农场已重置。"); }

  if (!ready) return <main className="loading"><span className="loading-dot" />正在唤醒刘看山…</main>;

  if (!farm.entered) return <Landing onEnter={enterFarm} />;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="看山沃野首页"><span className="brand-mark"><Icon name="leaf" /></span><span>看山沃野<small>让收藏重新长出来</small></span></a>
        <nav aria-label="主导航"><a href="#farm">我的沃野</a><a href="#progress">回顾簿</a><button className="text-button" onClick={speedUpDemo}><Icon name="clock" />演示加速</button></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow">刘看山的收藏农场</p><h1>你收藏过的那些，<br />会在这里慢慢长出来。</h1><p>不必完成任务，也不用读完。选好来源，让刘看山照料；想起时，再亲手收获。</p><div className="hero-actions"><button className="primary" onClick={() => setShowSources(true)}>管理内容来源 <Icon name="arrow" /></button><button className="quiet" onClick={speedUpDemo}>看看成长变化</button></div></div>
        <div className="guide-card"><img src="/assets/liukanshan-idle.gif" alt="正在农场待机的刘看山" /><div><p>刘看山说</p><strong>“今天也不用着急。”</strong><span>我会看着它们慢慢长大。</span></div></div>
      </section>

      <section className="farm-section" id="farm" aria-label="我的农场">
        <div className="section-heading"><div><p className="eyebrow">我的沃野</p><h2>十块地，留给十段正在生长的回忆</h2></div><div className="source-summary"><span>本轮来源</span><strong>{farm.sources.length ? farm.sources.join("、") : "尚未选择"}</strong><button onClick={() => setShowSources(true)}>修改</button></div></div>
        {notice && <div className="notice" role="status"><Icon name="spark" />{notice}<button aria-label="关闭提示" onClick={() => setNotice("")}>×</button></div>}
        <div className="farm-layout">
          <div className="plots" aria-label="十块农场地块">
            {PLOTS.map((plot) => { const crop = cropAt(plot); return <Plot key={plot} crop={crop} now={now} item={crop ? itemFor(crop) : undefined} selected={selectedPlot === plot} onSelect={() => setSelectedPlot(plot)} onPlant={() => plant(plot)} />; })}
          </div>
          <aside className="farm-aside"><div className="care-note"><span className="mini-icon"><Icon name="water" /></span><div><strong>默认由刘看山托管</strong><p>不来照料也会正常成熟；浇水只会稍微加快一点点。</p></div></div><div className="legend"><p>生长状态</p><span><i className="dot seed" />种子</span><span><i className="dot sprout" />幼苗</span><span><i className="dot mature" />成熟</span></div></aside>
        </div>
      </section>

      <section className="bottom-grid" id="progress">
        <div className="progress-card"><div className="card-title"><div><p className="eyebrow">本轮回顾</p><h2>慢慢来，也算在前进</h2></div><span>{harvestedCount} / {activeItems.length}</span></div><div className="progress-track"><i style={{ width: `${activeItems.length ? (harvestedCount / activeItems.length) * 100 : 0}%` }} /></div><p>点开成熟果实即完成一次回顾，不要求读完原帖。</p>{activeItems.length > 0 && harvestedCount === activeItems.length && <button className="primary small" onClick={newRound}>开启新一轮 <Icon name="arrow" /></button>}</div>
        <div className="achievements-card"><p className="eyebrow">回味印记</p><h2>你留下的足迹</h2><div className="badges"><Badge active={farm.achievements.includes("first")} title="初次回味" text="收获第一篇收藏" /><Badge active={farm.achievements.includes("three")} title="三次相遇" text="重温 3 篇收藏" /><Badge active={farm.achievements.includes("caretaker")} title="看山照料者" text="亲手浇过一次水" /></div></div>
      </section>

      <footer><span>Demo 演示模式 · 刷新页面后农场仍会保存在此浏览器</span><button onClick={resetDemo}>重置演示数据</button></footer>

      {selectedPlot !== null && <DetailModal crop={cropAt(selectedPlot)} item={cropAt(selectedPlot) ? itemFor(cropAt(selectedPlot)!) : undefined} now={now} onClose={() => setSelectedPlot(null)} onPlant={() => plant(selectedPlot)} onCare={() => cropAt(selectedPlot) && care(cropAt(selectedPlot)!)} onUproot={() => cropAt(selectedPlot) && uproot(cropAt(selectedPlot)!)} onHarvest={() => cropAt(selectedPlot) && harvest(cropAt(selectedPlot)!)} />}
      {showSources && <SourceModal sources={farm.sources} crops={farm.crops} onSave={(source) => { setSources(source); setShowSources(false); setNotice("内容来源已更新；已种下作物仍会保留原来的来源。 "); }} onClose={() => setShowSources(false)} />}
      {showHarvest && <HarvestModal item={showHarvest} onClose={() => setShowHarvest(null)} />}
    </main>
  );
}

function Landing({ onEnter }: { onEnter: () => void }) {
  return <main className="landing"><header className="topbar"><span className="brand"><span className="brand-mark"><Icon name="leaf" /></span><span>看山沃野<small>让收藏重新长出来</small></span></span><span className="demo-pill">DEMO 演示模式</span></header><section className="landing-content"><div><p className="eyebrow">把吃灰收藏，变成会生长的回忆</p><h1>总有一些内容，<br />值得再遇见一次。</h1><p>选择你的收藏夹，播下一颗种子。刘看山会替你照料；成熟以后，由你决定什么时候收获、是否打开。</p><div className="hero-actions"><button className="primary" onClick={onEnter}>进入演示农场 <Icon name="arrow" /></button><a className="quiet" href="/api/auth/zhihu">使用知乎登录（部署后启用）</a></div><p className="landing-note">当前为本地完整演示。真实部署后，以上入口会接入知乎 OAuth 和你的收藏夹。</p></div><div className="landing-visual"><div className="sun" /><div className="hill hill-one" /><div className="hill hill-two" /><div className="landing-plant plant-left"><i /><b /></div><div className="landing-plant plant-right"><i /><b /></div><img src="/assets/liukanshan-idle.gif" alt="刘看山在农场中" /></div></section><section className="principles"><div><Icon name="seed" /><strong>不需要管理背包</strong><span>空地播种，系统才随机挑选收藏。</span></div><div><Icon name="clock" /><strong>用户自己决定节奏</strong><span>成熟不会催促，想起时再来收获。</span></div><div><Icon name="leaf" /><strong>内容才是主角</strong><span>点开果实，就回到原来的知乎帖子。</span></div></section></main>;
}

function Plot({ crop, item, now, selected, onSelect, onPlant }: { crop?: Crop; item?: Item; now: number; selected: boolean; onSelect: () => void; onPlant: () => void }) {
  if (!crop) return <button className="plot empty" onClick={onPlant} aria-label="空地，点击播种"><span className="plot-number">空</span><span className="plus">+</span><strong>在这里播种</strong><small>从已选收藏夹随机挑选</small></button>;
  const stage = stageOf(crop, now);
  return <button className={`plot planted ${stage} ${selected ? "selected" : ""}`} onClick={onSelect} aria-label={`${stage === "mature" ? "成熟" : stage === "sprout" ? "幼苗" : "种子"}作物，点击查看`}><span className="soil" /><span className="plant-shape"><i /><b /><em /></span><span className="plot-content">{stage === "seed" && <><strong>正在扎根</strong><small>{item?.favlist}</small></>}{stage === "sprout" && <><strong>{item?.hint}</strong><small>{item?.tags.join(" · ")}</small></>}{stage === "mature" && <><strong>{item?.title}</strong><small>已成熟，等待收获</small></>}</span>{stage === "mature" && <span className="harvest-dot">可收获</span>}</button>;
}

function DetailModal({ crop, item, now, onClose, onPlant, onCare, onUproot, onHarvest }: { crop?: Crop; item?: Item; now: number; onClose: () => void; onPlant: () => void; onCare: () => void; onUproot: () => void; onHarvest: () => void }) {
  const stage = crop ? stageOf(crop, now) : null;
  const seconds = crop ? Math.max(0, Math.ceil((MATURE_AFTER - (now - crop.plantedAt + crop.careSeconds * 1000)) / 1000)) : 0;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label="地块详情" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="关闭">×</button>{!crop ? <><span className="modal-icon"><Icon name="seed" /></span><p className="eyebrow">空地</p><h2>种下一段回忆</h2><p>刘看山会从你选定的收藏夹中随机挑出一篇尚未回顾的内容。种下以后才会慢慢揭晓线索。</p><button className="primary full" onClick={onPlant}>随机播种 <Icon name="arrow" /></button></> : <><span className={`modal-icon ${stage}`}><Icon name={stage === "mature" ? "spark" : stage === "sprout" ? "leaf" : "seed"} /></span><p className="eyebrow">{stage === "mature" ? "成熟果实" : stage === "sprout" ? "正在长成" : "正在扎根"}</p><h2>{stage === "mature" ? item?.title : stage === "sprout" ? item?.hint : "这颗种子还没有说出它的故事"}</h2><p className="source-line">来自「{item?.favlist}」 · {item?.type}</p>{stage === "sprout" && <div className="tag-row">{item?.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}{stage !== "mature" && <p className="timer"><Icon name="clock" />大约 {seconds} 秒后成熟（演示时间）</p>}{stage === "mature" ? <button className="primary full" onClick={onHarvest}>收获并查看原帖 <Icon name="arrow" /></button> : <button className="secondary full" onClick={onCare}><Icon name="water" />浇一点水，稍微快一点</button>}<button className="danger-link" onClick={onUproot}><Icon name="shovel" />铲除作物（收藏不会丢失）</button></>}</section></div>;
}

function SourceModal({ sources, crops, onSave, onClose }: { sources: string[]; crops: Crop[]; onSave: (sources: string[]) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(sources);
  const toggle = (favlist: string) => setDraft((old) => old.includes(favlist) ? old.filter((value) => value !== favlist) : [...old, favlist]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal sources-modal" role="dialog" aria-modal="true" aria-label="选择收藏夹" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="关闭">×</button><p className="eyebrow">内容来源</p><h2>想从哪些收藏里，重新遇见自己？</h2><p>按收藏夹批量选择即可，不必逐条翻找。已经种下的作物会锁定原来源。</p><div className="source-list">{favlists.map((favlist) => { const count = items.filter((item) => item.favlist === favlist).length; return <label key={favlist}><input type="checkbox" checked={draft.includes(favlist)} onChange={() => toggle(favlist)} /><span className="checkbox"><Icon name="check" /></span><span><strong>{favlist}</strong><small>{count} 篇收藏 · 演示数据</small></span></label>; })}</div>{crops.length > 0 && <p className="modal-note">你农场里已有 {crops.length} 株作物；修改来源不会影响它们。</p>}<button className="primary full" onClick={() => onSave(draft)} disabled={!draft.length}>确认本轮来源 <Icon name="arrow" /></button></section></div>;
}

function HarvestModal({ item, onClose }: { item: Item; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal harvest-modal" role="dialog" aria-modal="true" aria-label="收获成功" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="关闭">×</button><span className="modal-icon mature"><Icon name="spark" /></span><p className="eyebrow">收获成功</p><h2>{item.title}</h2><p>这篇收藏已经记为本轮回顾。是否读完，完全由你决定。</p><div className="harvest-preview"><span>{item.type}</span><strong>{item.hint}</strong><small>{item.tags.join(" · ")} · 来自「{item.favlist}」</small></div><a className="primary full" href={item.url} target="_blank" rel="noreferrer">打开知乎原帖 <Icon name="arrow" /></a><button className="quiet center" onClick={onClose}>先留在农场</button></section></div>;
}

function Badge({ active, title, text }: { active: boolean; title: string; text: string }) { return <div className={`badge ${active ? "active" : ""}`}><span><Icon name={active ? "check" : "leaf"} /></span><strong>{title}</strong><small>{text}</small></div>; }
