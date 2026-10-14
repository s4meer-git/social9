import type { IconType } from "react-icons";
import { FaScissors, FaFaceSmile, FaUserTie, FaCropSimple, FaFloppyDisk, FaEraser as FaEraserIcon, FaFont } from "react-icons/fa6";

/*
 * The editor rail: one tool per pipeline stage (docs/editor-architecture.md §3).
 * Public tools (landing pages) map onto a rail tool + tab via `toolRoute`.
 */

export type RailId = "background" | "retouch" | "faces" | "text" | "profile" | "size" | "save";
export type RetouchTab = "erase" | "upscale";
export type BgTab = "remove" | "replace" | "blur";
export type FacesTab = "blur" | "pixelate" | "eyewear" | "sticker";

export interface RailTool {
  id: RailId;
  name: string;
  short: string;
  blurb: string;
  icon: IconType;
  /** Tailwind classes for the rail chip (full strings so they compile) */
  tint: string;
  fill: string;
}

export const railTools: RailTool[] = [
  { id: "background", name: "Background", short: "Background", blurb: "Remove, replace or blur it", icon: FaScissors, tint: "bg-violet-soft text-violet-deep", fill: "bg-violet text-white" },
  { id: "retouch", name: "Retouch", short: "Retouch", blurb: "Erase objects or make the photo sharper", icon: FaEraserIcon, tint: "bg-sun-soft text-amber-700", fill: "bg-sun text-ink" },
  { id: "faces", name: "Faces", short: "Faces", blurb: "Blur, pixelate, eyewear or stickers", icon: FaFaceSmile, tint: "bg-pink-soft text-pink-deep", fill: "bg-pink text-white" },
  { id: "text", name: "Text", short: "Text", blurb: "Add a caption", icon: FaFont, tint: "bg-tangerine-soft text-orange-700", fill: "bg-tangerine text-ink" },
  { id: "profile", name: "Profile picture", short: "Profile", blurb: "Profile pictures for every platform", icon: FaUserTie, tint: "bg-violet-soft text-violet-deep", fill: "bg-violet text-white" },
  { id: "size", name: "Size & crop", short: "Size", blurb: "Exact sizes for every platform", icon: FaCropSimple, tint: "bg-sky-soft text-sky-700", fill: "bg-sky text-ink" },
  { id: "save", name: "Save as", short: "Save", blurb: "Format, quality and file size", icon: FaFloppyDisk, tint: "bg-mint-soft text-emerald-700", fill: "bg-mint text-ink" },
];

export const railById = (id: RailId) => railTools.find((t) => t.id === id) ?? railTools[0];

export interface Route {
  rail: RailId;
  bgTab?: BgTab;
  facesTab?: FacesTab;
  retouchTab?: RetouchTab;
  /** open Size with "whole photo" framing */
  fit?: boolean;
}

/** Public tool id (landing page) → where it lives in the editor. */
export const toolRoute: Record<string, Route> = {
  "remove-bg": { rail: "background", bgTab: "remove" },
  "change-bg": { rail: "background", bgTab: "replace" },
  "blur-bg": { rail: "background", bgTab: "blur" },
  pfp: { rail: "profile" },
  resize: { rail: "size" },
  fit: { rail: "size", fit: true },
  "blur-faces": { rail: "faces", facesTab: "blur" },
  "face-stickers": { rail: "faces", facesTab: "sticker" },
  "remove-exif": { rail: "save" },
  convert: { rail: "save" },
  compress: { rail: "save" },
  "object-remover": { rail: "retouch", retouchTab: "erase" },
  upscale: { rail: "retouch", retouchTab: "upscale" },
  text: { rail: "text" },
};

export const isRailId = (v: string): v is RailId => railTools.some((t) => t.id === v);

/** Resolve a ?tool= value (public id or rail id). */
export function resolveRoute(v: string | null): Route | null {
  if (!v) return null;
  if (toolRoute[v]) return toolRoute[v];
  if (isRailId(v)) return { rail: v };
  return null;
}
