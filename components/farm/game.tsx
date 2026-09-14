"use client";
import { useEffect, useState } from "react";
import { assetForCrop, farmAssets } from "../../lib/farm-assets";
import { stageOf } from "../../lib/farm/model";
import { AssetImage, FarmScene, Mascot, SceneBackdrop } from "./scene";
import { AchievementPanel, CropPanel, HelpPanel, LogPanel, PlantingMemorialPanel, SettingsPanel, SourcePanel } from "./panels";
import { Icon } from "./icon";
import { useFarm } from "./use-farm";

type Panel = "sources" | "log" | "help" | "achievements" | "settings" | { plot: number } | null;
export default function Game() {
  const game = useFarm(), [panel, setPanel] = useState<Panel>(null), [accountMenu, setAccountMenu] = useState(false);
  const { farm, items, mode, now } = game;
  const mature = farm.crops.filter(c => stageOf(c, now) === "mature").length;
  useEffect(() => { setPanel(null); }, [mode]);
  const cropPreloadKey = farm.crops.map(crop => `${crop.id}:${crop.assetFamily}`).join("|");
  useEffect(() => {
    if (!game.ready) return;
    const scene = (farm.entered ? game.season : game.workspace.welcomeSeason) === "spring"
      ? (farm.entered ? farmAssets.scenes.springMain! : farmAssets.scenes.springWelcome!)
      : (farm.entered ? farmAssets.scenes.main : farmAssets.scenes.welcome ?? farmAssets.scenes.main);
    const refs = [scene, ...farm.crops.map(crop => assetForCrop(crop.assetFamily, stageOf(crop, now)))];
    const urls = new Set<string>();
    for (const ref of refs) {
      const portrait = ref.portrait && window.matchMedia("(orientation: portrait)").matches ? ref.portrait.src : undefined;
      urls.add(portrait ?? ref.src);
    }
    // Warm the browser cache in sequence. This avoids a request waterfall when
    // a plot or the mascot becomes visible, without issuing concurrent requests.
    let cancelled = false;
    const warm = async () => {
      for (const url of urls) {
        if (cancelled) return;
        await new Promise<void>(resolve => {
          const image = new window.Image();
          image.decoding = "async";
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = url;
        });
      }
    };
    void warm();
    return () => { cancelled = true; };
  }, [game.ready, farm.entered, game.season, game.workspace.welcomeSeason, cropPreloadKey]);
  const selected = typeof panel === "object" && panel ? farm.crops.find(c => c.plot === panel.plot) : undefined;
  const selectedItem = (mode === "personal" ? game.workspace.favoritePool : items).find(i => i.id === selected?.itemId);
  const close = () => setPanel(null);
  const overlays = <>
    {panel === "sources" && <SourcePanel key={mode} game={game} onClose={close} />}
    {panel === "log" && <LogPanel farm={farm} items={items} mode={mode} now={now} onClose={close} onNewRound={() => { close(); }} />}
    {panel === "help" && <HelpPanel onClose={close} />}
    {panel === "achievements" && <AchievementPanel farm={farm} onClose={close} />}
    {panel === "settings" && <SettingsPanel game={game} onClose={close} />}
    {game.memorial && <PlantingMemorialPanel memorial={game.memorial} onClose={game.clearMemorial} />}
    {selected && selectedItem && <CropPanel key={selected.id} crop={selected} item={selectedItem} mode={mode} now={now} onClose={close} onCare={() => { game.care(selected.id); close(); }} onUproot={() => { game.uproot(selected.id); close(); }} onHarvest={() => { const success = game.harvest(selected.id); if (success) close(); return success; }} />}
  </>;
  if (!game.ready) return <main className="loading"><Icon name="leaf" /><p>正在唤醒这片沃野…</p></main>;
  if (game.auth?.authenticated && game.favlistsLoading) return <main className="loading"><Icon name="folder" /><p>正在读取你的知乎收藏…</p><small>收藏同步完成后就可以继续</small></main>;
  return <main className={"game-shell " + (!farm.entered ? "title-screen" : "")}>
    <div className="scene-background"><AssetImage asset={(farm.entered ? game.season : game.workspace.welcomeSeason) === "spring" ? (farm.entered ? farmAssets.scenes.springMain! : farmAssets.scenes.springWelcome!) : (farm.entered ? farmAssets.scenes.main : farmAssets.scenes.welcome ?? farmAssets.scenes.main)} fallback={<SceneBackdrop />} /></div>
    <header className="game-hud"><div className="brand"><span className="brand-mark"><Icon name="leaf" /></span><span>看山沃野<small>让收藏重新长出来</small></span></div>
      {farm.entered && <button className="hud-source" onClick={() => setPanel("sources")}><Icon name="folder" /><span><small>内容来源</small><strong>{farm.sources.length ? farm.sources[0] + (farm.sources.length > 1 ? " 等 " + farm.sources.length + " 个收藏夹" : "") : "还未选择收藏夹"}</strong></span><span className="source-edit">查看</span></button>}
      <div className="hud-right"><div className="account-wrap"><button className={"hud-account " + (game.auth?.authenticated ? "" : "demo")} onClick={() => game.auth?.authenticated ? setAccountMenu(v => !v) : game.login()} aria-label={game.auth?.authenticated ? "账号菜单" : "登录知乎账号"}><Icon name="user"/><span><strong>{game.auth?.authenticated ? (game.auth.user?.id || "已登录") : "演示模式"}</strong><small>{game.auth?.authenticated ? "账号菜单" : "登录后读取我的收藏"}</small></span></button>{accountMenu && game.auth?.authenticated && <div className="account-menu"><button onClick={() => { setAccountMenu(false); game.login(); }}>切换账号</button><button onClick={() => { setAccountMenu(false); void game.logout(); }}>退出登录</button></div>}</div>{farm.entered && <button className="hud-progress" onClick={() => setPanel("log")} aria-label="查看收获记录"><span className="progress-ring"><Icon name="leaf" /></span><span><strong>{farm.log.length}</strong><small>已收获</small></span></button>}<button className="icon-button hud-settings" onClick={() => setPanel("settings")} aria-label="农场设置"><Icon name="settings" /></button></div>
    </header>
    {farm.entered ? <>
      <FarmScene crops={farm.crops} now={now} event={game.event} onPlot={plot => { if (farm.crops.some(c => c.plot === plot)) setPanel({ plot }); else game.plant(plot); }} onMap={() => setPanel("achievements")} />
      <div className="farm-status"><span className="status-dot"/><span className="farm-status-message">{mature ? mature + " 段回忆已成熟，随时来收获" : farm.crops.length ? "回忆正在生长，刘看山替你照料" : "点一块空地，种下今天的小惊喜"}</span></div>
      <nav className="action-dock" aria-label="农场操作"><button onClick={() => setPanel("log")}><Icon name="book" /><span>收获记录</span>{farm.log.length > 0 && <b>{farm.log.length}</b>}</button><span className="dock-divider"/><button onClick={() => setPanel("sources")}><Icon name="folder" /><span>内容来源</span></button><button onClick={() => setPanel("achievements")}><Icon name="trophy" /><span>作物图鉴</span></button><button onClick={() => setPanel("help")}><Icon name="help" /><span>玩法帮助</span></button></nav>
    </> : <section className="welcome"><div className="welcome-copy"><p className="eyebrow">刘看山的收藏农场</p><h1>从前收藏的，<br/>今天又长出来了。</h1><p className="welcome-description">把忘在角落的好内容，种成一片小小沃野。<br/>看山替你照料，想起时，再来遇见。</p><div className="welcome-actions"><button className="primary" onClick={() => game.start(mode)}>{mode === "demo" ? "去我的演示农场" : "去我的个人农场"}<Icon name="arrow" /></button>{!game.auth?.authenticated && <button className="secondary" onClick={() => game.login()}>登录知乎，读取我的收藏</button>}</div><p className="welcome-footnote">没有打卡，没有枯萎。只有一点点期待。</p></div><div className="welcome-mascot"><Mascot event={null} matureCount={0}/></div></section>}
    <div className="announcement" role="status" aria-live="polite" aria-atomic="true">{game.notice && <div className="toast"><Icon name="spark" /><span>{game.notice}</span><button aria-label="关闭提示" onClick={() => game.setNotice("")}><Icon name="close" /></button></div>}</div>
    {game.favlistsLoading && game.auth?.authenticated && <div className="account-loading" role="status"><Icon name="folder" /><strong>正在读取你的知乎收藏…</strong><span>收藏同步完成后就可以开始农场</span></div>}
    {game.storageWarning && <button className="storage-warning" onClick={() => setPanel("settings")}><Icon name="help" />{game.storageWarning}</button>}
    {overlays}
  </main>;
}