/**
 * Captions drawn on the finished picture (after cropping), so they stay where you put them
 * when you change the size. Positions and sizes are fractions of the picture.
 */

export type FontId = "display" | "sans" | "serif" | "mono";
export type TextStyleId = "bold" | "clean" | "caption" | "highlight" | "classic";

export interface TextItem {
  id: string;
  text: string;
  /** center of the text, 0..1 across and down the picture */
  x: number;
  y: number;
  /** letter height as a fraction of the picture's shorter side */
  size: number;
  font: FontId;
  color: string;
  /** a dark or light edge around each letter, for contrast on busy photos */
  outline: boolean;
  shadow: boolean;
  /** a rounded box behind the text, or null */
  box: string | null;
  uppercase: boolean;
  style: TextStyleId;
}

export const TEXT_FONTS: { id: FontId; name: string }[] = [
  { id: "display", name: "Bold" },
  { id: "sans", name: "Clean" },
  { id: "serif", name: "Serif" },
  { id: "mono", name: "Mono" },
];

/** Ready-made looks. Picking one sets several options at once. */
export const TEXT_STYLES: { id: TextStyleId; name: string; patch: Partial<TextItem> }[] = [
  { id: "bold", name: "Bold", patch: { font: "display", color: "#ffffff", outline: true, shadow: true, box: null, uppercase: false } },
  { id: "clean", name: "Clean", patch: { font: "sans", color: "#ffffff", outline: false, shadow: true, box: null, uppercase: false } },
  { id: "caption", name: "Caption box", patch: { font: "sans", color: "#ffffff", outline: false, shadow: false, box: "rgba(15,14,23,0.78)", uppercase: false } },
  { id: "highlight", name: "Highlight", patch: { font: "display", color: "#0f0e17", outline: false, shadow: false, box: "#d4ff4f", uppercase: true } },
  { id: "classic", name: "Classic", patch: { font: "serif", color: "#ffffff", outline: false, shadow: true, box: null, uppercase: false } },
];

export const TEXT_COLORS = ["#ffffff", "#0f0e17", "#ff4fa3", "#6d4aff", "#d4ff4f", "#ffc93c", "#38bdf8", "#ff5a36"];

let counter = 0;
/** A new caption, placed a little lower each time so they don't stack exactly. */
export function newText(index: number): TextItem {
  return {
    id: `t${Date.now().toString(36)}${counter++}`,
    text: "Your text",
    x: 0.5,
    y: Math.min(0.85, 0.5 + index * 0.12),
    size: 0.09,
    style: "bold",
    ...(TEXT_STYLES[0].patch as Omit<TextItem, "id" | "text" | "x" | "y" | "size" | "style">),
  };
}

/** CSS font stack for a font id. The site's own fonts are read from their CSS variables. */
function family(font: FontId): string {
  const css = (name: string) => (typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : "");
  switch (font) {
    case "display":
      return `${css("--font-cabinet") || "system-ui"}, system-ui, sans-serif`;
    case "sans":
      return `${css("--font-satoshi") || "system-ui"}, system-ui, sans-serif`;
    case "serif":
      return `Georgia, "Times New Roman", serif`;
    case "mono":
      return `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
  }
}

const weight = (font: FontId) => (font === "display" ? 900 : font === "serif" ? 700 : 700);

interface Layout {
  font: string;
  px: number;
  lines: string[];
  lineHeight: number;
  /** text block size, without the box */
  width: number;
  height: number;
  pad: number;
}

function layout(ctx: CanvasRenderingContext2D, t: TextItem, W: number, H: number): Layout {
  const lines = (t.uppercase ? t.text.toUpperCase() : t.text).split("\n");
  const measure = (px: number) => {
    ctx.font = `${weight(t.font)} ${px}px ${family(t.font)}`;
    return Math.max(...lines.map((l) => ctx.measureText(l || " ").width));
  };
  let px = Math.max(4, t.size * Math.min(W, H));
  let width = measure(px);
  // long captions shrink to fit inside the picture (box padding included)
  const room = W * 0.94;
  const extra = t.box ? 0.76 : 0.24;
  if (width + px * extra > room) {
    px = Math.max(4, (px * room) / (width + px * extra));
    width = measure(px);
  }
  const font = `${weight(t.font)} ${px}px ${family(t.font)}`;
  ctx.font = font;
  const lineHeight = px * 1.15;
  return { font, px, lines, lineHeight, width, height: lineHeight * lines.length, pad: px * 0.38 };
}

let measurer: CanvasRenderingContext2D | null = null;

/** Where a caption sits, in picture pixels (for the selection outline and dragging). */
export function textBounds(t: TextItem, W: number, H: number) {
  measurer ??= document.createElement("canvas").getContext("2d");
  const l = layout(measurer!, t, W, H);
  const pad = t.box ? l.pad : l.px * 0.12;
  const w = l.width + pad * 2;
  const h = l.height + pad * 2;
  return { x: t.x * W - w / 2, y: t.y * H - h / 2, w, h };
}

/** Draw every caption onto a picture of size W × H. */
export function drawTexts(ctx: CanvasRenderingContext2D, texts: TextItem[], W: number, H: number) {
  for (const t of texts) {
    if (!t.text.trim()) continue;
    const l = layout(ctx, t, W, H);
    const cx = t.x * W;
    const top = t.y * H - l.height / 2;
    ctx.save();
    ctx.font = l.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    if (t.box) {
      const bw = l.width + l.pad * 2;
      const bh = l.height + l.pad * 1.4;
      ctx.fillStyle = t.box;
      ctx.beginPath();
      ctx.roundRect(cx - bw / 2, t.y * H - bh / 2, bw, bh, Math.min(bh / 2, l.px * 0.45));
      ctx.fill();
    }
    l.lines.forEach((line, i) => {
      const y = top + l.lineHeight * (i + 0.5);
      if (t.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.38)";
        ctx.shadowBlur = l.px * 0.18;
        ctx.shadowOffsetY = l.px * 0.05;
      }
      if (t.outline) {
        ctx.strokeStyle = isLight(t.color) ? "rgba(15,14,23,0.92)" : "rgba(255,255,255,0.95)";
        ctx.lineWidth = l.px * 0.14;
        ctx.strokeText(line, cx, y);
        ctx.shadowColor = "transparent";
      }
      ctx.fillStyle = t.color;
      ctx.fillText(line, cx, y);
      ctx.shadowColor = "transparent";
    });
    ctx.restore();
  }
}

function isLight(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = n >> 16;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
}
