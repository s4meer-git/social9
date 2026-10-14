"use client";

import { useSyncExternalStore } from "react";

/**
 * "Install Social9" state. Chrome and Edge fire `beforeinstallprompt` once, often before
 * React hydrates, so a tiny inline script in the root layout catches it into
 * `window.__s9install` (see install-catcher.ts). This store reads it from there.
 */
export type InstallEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

declare global {
  interface Window {
    __s9install?: InstallEvent | null;
  }
}


type Snapshot = { prompt: InstallEvent | null; installed: boolean };
const server: Snapshot = { prompt: null, installed: false };
let current: Snapshot = server;

function read(): Snapshot {
  const prompt = window.__s9install ?? null;
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  if (prompt !== current.prompt || installed !== current.installed) current = { prompt, installed };
  return current;
}

function subscribe(cb: () => void) {
  window.addEventListener("s9install", cb);
  return () => window.removeEventListener("s9install", cb);
}

export function useInstall() {
  return useSyncExternalStore(subscribe, read, () => server);
}

/** Show the native install dialog; the prompt can only be used once. */
export async function promptInstall(e: InstallEvent) {
  await e.prompt();
  window.__s9install = null;
  window.dispatchEvent(new Event("s9install"));
}

export type BrowserKind = "chromium" | "safari-mac" | "safari-ios" | "firefox" | "other";

export function detectBrowser(): BrowserKind {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "safari-ios";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Edg\/|Chrome\/|Chromium\//.test(ua)) return "chromium";
  if (/Safari\//.test(ua)) return "safari-mac";
  return "other";
}
