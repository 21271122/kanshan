import type { ReactNode } from "react";
export type IconName = "leaf" | "water" | "spark" | "arrow" | "check" | "clock" | "book" | "settings" | "map" | "close" | "help" | "folder" | "sun" | "shovel" | "external" | "lock" | "download" | "user" | "trophy" | "logout";
const shapes: Record<IconName, ReactNode> = {
  leaf: <><path d="M20 3C9 3 3 8 4 15s11 7 14-2c1-3 2-6 2-10Z"/><path d="M4 21 15 10"/></>,
  water: <path d="M12 3c-2 4-7 8-7 12a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/>,
  spark: <><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/><path d="m20 2 0 4m-2-2h4"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  book: <><path d="M4 4h7l1 2 1-2h7v15h-7l-1 1-1-1H4Z"/><path d="M12 6v14"/></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></>,
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16m6-14v16"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 1c0 2-3 2-3 5m0 3h.01"/></>,
  folder: <path d="M3 6h7l2 3h9v11H3Zm0 0V4h7l2 2h8v3"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></>,
  shovel: <><path d="m16 3 5 5-2 2-5-5ZM16 8l-6 6m-3-2 5 5-5 4-4-4Z"/></>,
  external: <><path d="M14 3h7v7m0-7L10 14"/><path d="M10 4H4v16h16v-6"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.6-4 2.8-6 7-6s6.4 2 7 6"/></>,
  trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8"/></>,
  logout: <><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4m4-4H8"/></>,
};
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={"icon " + className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

