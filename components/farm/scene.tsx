"use client";
import { useEffect, useState, type ReactNode } from "react";
import { assetForCrop, farmAssets, mascotActionForEvent, type FarmZone, type AssetRef } from "../../lib/farm-assets";
import { growthOf, stageOf, type Crop, type FarmEvent, type Stage } from "../../lib/farm/model";
import { Icon } from "./icon";
import { cropFamilyName } from "../../lib/farm/crop-families";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => { const query = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  return reduced;
}
function ImageLayer({ asset, fallback }: { asset: AssetRef; fallback: ReactNode }) {
  const reduced = useReducedMotion();
  const preferred = asset.available === false || (reduced && asset.format === "gif") ? asset.fallback : asset.src;
  const [failed, setFailed] = useState<string[]>([]), [loaded, setLoaded] = useState("");
  const src = [preferred, asset.fallback].find((s): s is string => !!s && !failed.includes(s));
  const picture = asset.portrait && !failed.includes(asset.portrait.src);
  return <>{(!src || loaded !== src) && fallback}{src && <picture>
    {picture && <source media="(orientation: portrait)" srcSet={asset.portrait!.src} width={asset.portrait!.width} height={asset.portrait!.height}/>}
    <img key={src} src={src} alt={asset.alt ?? ""} width={asset.width} height={asset.height} draggable={false}
      onLoad={() => setLoaded(src)}
      onError={e => { const actual = e.currentTarget.currentSrc; setFailed(old => [...old, picture && actual.endsWith(asset.portrait!.src) ? asset.portrait!.src : src]); }}
      style={{ opacity: loaded === src ? 1 : 0 }}/>
  </picture>}</>;
}
export function AssetImage({ asset, fallback, className = "" }: { asset: AssetRef; fallback: ReactNode; className?: string }) {
  return <span className={"asset-image " + className}><ImageLayer key={asset.src} asset={asset} fallback={fallback} /></span>;
}
export const zones: FarmZone[] = [
  { id: "main-field", name: "主农场", unlocked: true, background: farmAssets.scenes.main, plotCount: 10, assetFamily: "default" },
  { id: "east-field", name: "东侧新田", unlocked: false, background: farmAssets.scenes.lockedField ?? farmAssets.scenes.main, plotCount: 6, assetFamily: "default" },
  { id: "hillside", name: "山坡果园", unlocked: false, background: farmAssets.scenes.main, plotCount: 6, assetFamily: "default" }
];
export function SceneBackdrop() {
  return <svg className="landscape" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#e7eddc"/><stop offset="1" stopColor="#fbf4dc"/></linearGradient><linearGradient id="ground" x2="0" y2="1"><stop stopColor="#c7d6ae"/><stop offset="1" stopColor="#98b47b"/></linearGradient></defs>
    <path fill="url(#sky)" d="M0 0h1600v900H0z"/><circle cx="1208" cy="151" r="62" fill="#f9e9b6"/><circle cx="1208" cy="151" r="84" fill="#f9e9b6" opacity=".23"/>
    <path fill="#c3d1b9" d="M0 368 139 279l66 49 184-163 213 197 170-97 218 103 197-188 164 181 129-82 120 90v400H0Z"/>
    <path fill="#acbfa3" d="M0 375 148 335l190 99 196-163 176 155 255-164 246 143 179-91 210 84v350H0Z"/>
    <path fill="#8faa86" d="M0 416Q186 307 433 437T854 390T1256 417T1600 382v450H0Z"/>
    <path fill="url(#ground)" d="M0 462Q438 427 800 471T1600 452v448H0Z"/>
    <path fill="#dfd3ad" d="M1600 520Q1373 491 1315 590T1411 772L1600 900h-312q-198-159-130-260t442-120Z"/>
    <path d="M0 840Q315 759 526 878T1011 864T1600 861v39H0Z" fill="#85a56f"/>
    <g fill="#739563"><ellipse cx="75" cy="510" rx="64" ry="98"/><ellipse cx="1538" cy="463" rx="63" ry="98"/><ellipse cx="1489" cy="499" rx="54" ry="72"/></g>
    <g stroke="#7c865e" strokeWidth="12" strokeLinecap="round"><path d="M76 530v88m1468-31 10 79m61-124 7 78"/></g>
    <g stroke="#edf0ca" strokeWidth="8" strokeLinecap="round"><path d="m45 701 4 65m61-53 2 61m-81-53 108 10M1438 733l-6 61m65-45-4 68m-82-66 107 16"/></g>
    <g fill="#f6e6b2"><circle cx="169" cy="792" r="5"/><circle cx="177" cy="780" r="4"/><circle cx="1470" cy="850" r="5"/><circle cx="127" cy="595" r="4"/></g>
    <g fill="none" stroke="#6f945c" strokeWidth="3"><path d="m230 706 3-13 5 10m1054 128 3-13 5 10M945 868l3-13 5 10m-860-11 3-13 5 10"/></g>
  </svg>;
}
function Soil() { return <svg viewBox="0 0 200 120" aria-hidden="true"><path d="M9 63 68 23q12-8 24-4l94 30q12 4 4 13l-60 44q-8 6-19 2L13 79q-12-4-4-16Z" fill="#8e6144"/><path d="m10 55 60-40q10-7 23-3l91 29q13 4 5 13l-62 44q-7 5-19 1L13 70Q0 66 10 55Z" fill="#b3865d" stroke="#cbab79" strokeWidth="3"/><g stroke="#936b49" strokeWidth="4" strokeLinecap="round" opacity=".7"><path d="m34 55 54 17m-30-35 53 17m-29-34 55 17m-47 36 32 10m-8-28 32 10"/></g></svg>; }
export function CropDrawing({ stage }: { stage: Stage }) {
  return <svg viewBox="0 0 160 180" aria-hidden="true">
    <ellipse cx="82" cy="155" rx="27" ry="7" fill="#594e2f" opacity=".15"/>
    {stage === "seed" ? <><path d="M72 152q-13-26 3-28t13 25Z" fill="#6f482e"/><path d="M79 132q-9-23 9-30 8 18-9 30Z" fill="#7fa65b"/><path d="M77 139q-20-4-18-19 22-1 18 19Z" fill="#517947"/></> : <>
      <path d="M82 153q-3-45 3-94" fill="none" stroke="#4e7540" strokeWidth="7" strokeLinecap="round"/>
      <path d="M82 125Q33 129 34 94q35-9 48 31" fill="#658b4c"/><path d="M83 102q48 3 44-33-29-7-44 33" fill="#80a45b"/>
      <path d="M84 85Q55 82 57 54q35-4 27 31" fill="#759950"/><path d="M85 73q36-9 20-40-26 8-20 40" fill="#96b467"/>
      {stage === "mature" && <><circle cx="59" cy="89" r="21" fill="#e4a647"/><circle cx="106" cy="64" r="23" fill="#edb858"/><circle cx="99" cy="117" r="22" fill="#d9903c"/><path d="m59 68 7-9m38-17 6-10m-11 62 7-8" stroke="#567341" strokeWidth="4"/><path d="M47 83q3-6 10-6m38-21q3-7 11-7m-18 63q3-5 8-6" stroke="#f9d592" strokeWidth="4" fill="none" strokeLinecap="round"/></>}
    </>}
  </svg>;
}
export function Plot({ index, crop, now, onClick, event }: { index: number; crop?: Crop; now: number; onClick: () => void; event: FarmEvent | null }) {
  const stage = crop ? stageOf(crop, now) : "empty";
  const activeEvent = event?.plot === index ? event : null;
  const name = crop ? cropFamilyName(crop.assetFamily) : "留一格给惊喜";
  const asset = crop ? assetForCrop(crop.assetFamily, stage as Stage) : undefined;
  return <button className={"plot plot-" + stage + (asset?.presentation === "illustration" ? " plot-illustration" : "")} onClick={onClick}
    aria-label={index + 1 + " 号地 · " + (stage === "empty" ? "空地，点击播种" : stage === "mature" ? "成熟，查看收获预览" : stage === "sprout" ? "幼苗，查看线索" : "种子，查看成长") + (crop ? " · " + name : "")}>
    <span className="plot-art">
      {crop ? <AssetImage asset={asset!} fallback={<CropDrawing stage={stage as Stage} />}/> : <span className="empty-bed"><Icon name="leaf"/><span>＋ 播种</span></span>}
      {crop && (stage === "mature" ? <span className="ready-bubble"><Icon name="spark"/>可收获</span> : <span className="plot-progress" aria-hidden="true"><i style={{ transform: "scaleX(" + growthOf(crop, now) + ")" }}/></span>)}
    </span>
    <span className="plot-caption"><span className="plot-index">{String(index + 1).padStart(2, "0")}</span><span>{name}</span></span>
    {activeEvent && <span key={activeEvent.at} className={"plot-effect effect-" + activeEvent.type.toLowerCase()} aria-hidden="true"><EffectVisual event={activeEvent}/><i/><i/><i/></span>}
  </button>;
}
const actionFor = mascotActionForEvent;
export function Mascot({ event, matureCount }: { event: FarmEvent | null; matureCount: number }) {
  const action = event ? actionFor[event.type] : "idle";
  const asset = farmAssets.mascot[action] ?? farmAssets.mascot.idle;
  const message = event?.type === "PLANT" ? "种好啦，等它慢慢长大。" : event?.type === "CARE" ? "收到一小份关心。" : event?.type === "HARVEST" ? "又遇见了过去的自己。" : matureCount ? "有回忆成熟啦，要看看吗？" : "你忙你的，这里有我。";
  return <div className={"mascot mascot-" + action}><div className="mascot-bubble"><small>刘看山说</small><p>{message}</p></div><div className="mascot-character" key={event?.at ?? "idle"}><AssetImage asset={asset} fallback={<span className="mascot-placeholder">看山</span>} /></div></div>;
}
export function FarmScene({ crops, now, event, onPlot, onMap }: { crops: Crop[]; now: number; event: FarmEvent | null; onPlot: (plot: number) => void; onMap: () => void }) {
  const zone = zones[0];
  return <section className="farm-scene" aria-label="主农场，共十块地">
    <div className="scene-heading"><div><p className="eyebrow">一小片地，慢慢遇见</p><h1>我的沃野<span>秋日生长季</span></h1></div><span className="weather"><Icon name="sun" />晴 · 适合想起一些事</span></div>
    <div className="field-area"><div className="field-boundary"/><div className="field" aria-label="十块可交互地块">{Array.from({ length: zone.plotCount }, (_, index) => <Plot key={index} index={index} crop={crops.find(c => c.plot === index)} now={now} event={event} onClick={() => onPlot(index)} />)}</div></div>
    <Mascot event={event} matureCount={crops.filter(c => stageOf(c, now) === "mature").length} />
    <button className="zone-sign" onClick={onMap}><span><Icon name="lock" />东侧新田</span><small>去地图看看 <Icon name="arrow" /></small></button>
  </section>;
}



function EffectVisual({ event }: { event: FarmEvent }) { const asset = event.type === "CARE" ? farmAssets.effects.water : event.type === "HARVEST" ? farmAssets.effects.harvest : farmAssets.effects.sparkle; const fallback = <Icon name={event.type === "CARE" ? "water" : "spark"}/>; return asset ? <AssetImage asset={asset} fallback={fallback}/> : fallback; }
