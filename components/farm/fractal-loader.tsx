"use client";

import { useEffect, useRef } from "react";

const DURATION = 20_000;
const LEVELS = 10;

export function FractalLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const elapsed = reducedMotion ? DURATION : (now - startedAt) % DURATION;
      const seconds = elapsed / 1000;
      const groundY = rect.height * 0.84;
      context.fillStyle = "#a97d53";
      context.fillRect(rect.width * 0.14, groundY, rect.width * 0.72, 4);
      context.fillRect(rect.width * 0.18, groundY + 7, rect.width * 0.64, 3);
      const ease = (value: number) => value * value * (3 - 2 * value);
      const clamp = (value: number) => Math.max(0, Math.min(1, value));
      const branch = (x: number, y: number, length: number, angle: number, level: number) => {
        if (level >= LEVELS) return;
        const local = ease(clamp((seconds - level * 2) / 2));
        if (local <= 0) return;
        const endX = x + Math.cos(angle) * length * local;
        const endY = y + Math.sin(angle) * length * local;
        context.strokeStyle = level < 4 ? "#9a704d" : "#759863";
        context.lineWidth = Math.max(1.5, 6 - level * 0.48);
        context.lineCap = "round";
        context.beginPath(); context.moveTo(x, y); context.lineTo(endX, endY); context.stroke();
        const spread = 0.62 + level * 0.018;
        branch(endX, endY, length * (4.5 / 6), angle - spread, level + 1);
        branch(endX, endY, length * (4.5 / 6), angle + spread, level + 1);
        if (level >= 7 && local > 0.85) { context.fillStyle = "#a9c97b"; context.beginPath(); context.arc(endX, endY, 2.4, 0, Math.PI * 2); context.fill(); }
      };
      branch(rect.width / 2, groundY, Math.min(98, rect.height * 0.27), -Math.PI / 2, 0);
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return <div className="fractal-loader" role="status" aria-live="polite"><canvas ref={canvasRef} aria-label="一棵分形树正在生长" /><p>刘看山陪你等收藏慢慢长出来<span className="fractal-loader-dots"><i /><i /><i /></span></p><small>预计等待约 20 秒，请稍候</small></div>;
}
