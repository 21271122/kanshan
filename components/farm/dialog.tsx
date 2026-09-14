"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

export function Dialog({ title, eyebrow, children, onClose, wide = false, headerActions, onTitleClick, titleExpanded }: { title: string; eyebrow?: string; children: ReactNode; onClose: () => void; wide?: boolean; headerActions?: ReactNode; onTitleClick?: () => void; titleExpanded?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const node = ref.current, trigger = document.activeElement as HTMLElement | null;
    node?.showModal();
    return () => { node?.close(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={"dialog " + (wide ? "dialog-wide" : "")} aria-labelledby={titleId}
    onCancel={e => { e.preventDefault(); closeRef.current(); }}
    onKeyDown={e => {
      if (e.key !== "Tab") return;
      const targets = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex="0"]')).filter(node => node.getClientRects().length > 0);
      const first = targets[0], last = targets[targets.length - 1];
      if (!first) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || !targets.includes(document.activeElement as HTMLElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}
    onClick={e => {
      if (e.target !== e.currentTarget) return;
      const b = e.currentTarget.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) onClose();
    }}>
    <header className="dialog-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}{onTitleClick ? <button type="button" className="dialog-title-toggle" onClick={onTitleClick} aria-expanded={titleExpanded} aria-controls="chat-conversation-list"><span id={titleId} role="heading" aria-level={2}>{title}</span></button> : <h2 id={titleId}>{title}</h2>}</div><div className="dialog-header-actions">{headerActions}<button className="icon-button" onClick={onClose} aria-label="关闭浮窗" autoFocus><Icon name="close" /></button></div></header>
    <div className="dialog-body">{children}</div>
  </dialog>;
}

