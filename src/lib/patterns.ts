import { canFilter } from "@social9/core/image/canvas-filter";

/**
 * Pattern backgrounds, drawn in code so they stay sharp at any output size.
 * Each pattern paints the whole W×H area. Sizes scale with the shorter side, so a
 * pattern looks the same on a 320px avatar and a 4000px export.
 */
export interface Pattern {
  id: string;
  name: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/** A circle that fades to transparent at its edge: a stand-in for blur where ctx.filter is missing. */
function fadeOut(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, blur: number) {
  const R = r * (1 + blur * 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, color);
  g.addColorStop(Math.max(0, 1 - blur * 4), color);
  // same colour at zero alpha, so the edge doesn't fade through grey
  g.addColorStop(1, /^#[0-9a-f]{6}$/i.test(color) ? color + "00" : "transparent");
  return g;
}

const lin = (ctx: CanvasRenderingContext2D, w: number, h: number, stops: string[], angle = 135) => {
  const a = (angle * Math.PI) / 180;
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createLinearGradient(w / 2 - Math.cos(a) * r, h / 2 - Math.sin(a) * r, w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

/** Deterministic pseudo-random so a pattern renders identically in preview and export. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function dots(bg: string, dot: string, step = 0.06, r = 0.012): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    const s = u * step;
    ctx.fillStyle = dot;
    for (let y = s / 2; y < h; y += s)
      for (let x = s / 2 + ((Math.round(y / s) % 2) * s) / 2; x < w; x += s) {
        ctx.beginPath();
        ctx.arc(x, y, u * r, 0, Math.PI * 2);
        ctx.fill();
      }
  };
}

function stripes(a: string, b: string, width = 0.05, angle = -45): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h) * width;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.fillStyle = b;
    const R = Math.hypot(w, h);
    for (let x = -R; x < R; x += u * 2) ctx.fillRect(x, -R, u, R * 2);
    ctx.restore();
  };
}

function blobs(base: string[], colors: string[], seed: number, blur = 0.12): Pattern["draw"] {
  return (ctx, w, h) => {
    lin(ctx, w, h, base);
    const u = Math.min(w, h);
    const rand = rng(seed);
    ctx.save();
    const soft = canFilter();
    if (soft) ctx.filter = `blur(${Math.round(u * blur)}px)`;
    colors.forEach((c) => {
      const x = rand() * w;
      const y = rand() * h;
      const r = u * (0.25 + rand() * 0.25);
      ctx.fillStyle = soft ? c : fadeOut(ctx, x, y, r, c, blur);
      ctx.beginPath();
      ctx.arc(x, y, soft ? r : r * (1 + blur * 2), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };
}

function confetti(bg: string, colors: string[], seed: number): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    const rand = rng(seed);
    const n = Math.round((w * h) / (u * u) * 70);
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.translate(rand() * w, rand() * h);
      ctx.rotate(rand() * Math.PI);
      ctx.fillStyle = colors[i % colors.length];
      const s = u * (0.012 + rand() * 0.018);
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-s, -s * 0.35, s * 2, s * 0.7);
      ctx.restore();
    }
  };
}

function rays(a: string, b: string, n = 24): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, w, h);
    const R = Math.hypot(w, h);
    ctx.fillStyle = b;
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI * 2;
      const t1 = t0 + Math.PI / n;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.lineTo(w / 2 + Math.cos(t0) * R, h / 2 + Math.sin(t0) * R);
      ctx.lineTo(w / 2 + Math.cos(t1) * R, h / 2 + Math.sin(t1) * R);
      ctx.fill();
    }
  };
}

function rings(colors: string[]): Pattern["draw"] {
  return (ctx, w, h) => {
    const R = Math.hypot(w, h) / 2;
    const n = colors.length * 3;
    for (let i = n; i > 0; i--) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, (R * i) / n, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function grid(bg: string, line: string, step = 0.08): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    const s = u * step;
    ctx.strokeStyle = line;
    ctx.lineWidth = Math.max(1, u * 0.003);
    ctx.beginPath();
    for (let x = 0; x <= w; x += s) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += s) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  };
}

function checks(a: string, b: string, step = 0.1): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) * step;
    ctx.fillStyle = b;
    for (let y = 0, r = 0; y < h; y += s, r++) for (let x = (r % 2) * s; x < w; x += s * 2) ctx.fillRect(x, y, s, s);
  };
}

function waves(bg: string, line: string): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    ctx.strokeStyle = line;
    ctx.lineWidth = u * 0.012;
    ctx.lineCap = "round";
    const step = u * 0.07;
    for (let y = -step; y < h + step; y += step) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += u * 0.01) ctx.lineTo(x, y + Math.sin((x / u) * Math.PI * 6) * u * 0.018);
      ctx.stroke();
    }
  };
}

function halftone(bg: string, dot: string): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    const s = u * 0.04;
    ctx.fillStyle = dot;
    for (let y = s / 2; y < h; y += s)
      for (let x = s / 2; x < w; x += s) {
        const t = Math.hypot(x - w, y - h) / Math.hypot(w, h);
        ctx.beginPath();
        ctx.arc(x, y, s * 0.48 * Math.max(0, 1 - t * 1.1), 0, Math.PI * 2);
        ctx.fill();
      }
  };
}

function memphis(bg: string, colors: string[], seed: number): Pattern["draw"] {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const u = Math.min(w, h);
    const rand = rng(seed);
    const n = Math.round((w * h) / (u * u) * 28);
    ctx.lineWidth = u * 0.008;
    ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const s = u * (0.025 + rand() * 0.03);
      const c = colors[i % colors.length];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * Math.PI);
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      switch (i % 4) {
        case 0:
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s, s);
          ctx.lineTo(-s, s);
          ctx.closePath();
          ctx.fill();
          break;
        case 1:
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 2:
          ctx.beginPath();
          for (let k = -2; k <= 2; k++) ctx.lineTo(k * s * 0.5, (k % 2 ? -1 : 1) * s * 0.4);
          ctx.stroke();
          break;
        default:
          ctx.fillRect(-s * 0.15, -s, s * 0.3, s * 2);
          ctx.fillRect(-s, -s * 0.15, s * 2, s * 0.3);
      }
      ctx.restore();
    }
  };
}

function bokeh(base: string[], light: string, seed: number): Pattern["draw"] {
  return (ctx, w, h) => {
    lin(ctx, w, h, base, 160);
    const u = Math.min(w, h);
    const rand = rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 40; i++) {
      const r = u * (0.02 + rand() * 0.09);
      ctx.globalAlpha = 0.15 + rand() * 0.35;
      const x = rand() * w;
      const y = rand() * h;
      if (canFilter()) ctx.filter = `blur(${Math.round(r * 0.18)}px)`;
      ctx.fillStyle = canFilter() ? light : fadeOut(ctx, x, y, r, light, 0.18);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };
}

export const patterns: Pattern[] = [
  { id: "mesh-candy", name: "Candy mesh", draw: blobs(["#ffd6e8", "#e0d4ff"], ["#ff4fa3", "#6d4aff", "#ffb347"], 7) },
  { id: "mesh-ocean", name: "Ocean mesh", draw: blobs(["#cdeffd", "#d9d4ff"], ["#38bdf8", "#6d4aff", "#34d399"], 11) },
  { id: "mesh-sunset", name: "Sunset mesh", draw: blobs(["#ffe4c7", "#ffd1dc"], ["#ff8a3d", "#ff4f7b", "#ffc93c"], 19) },
  { id: "mesh-night", name: "Night mesh", draw: blobs(["#14112b", "#251a4f"], ["#6d4aff", "#ff4fa3", "#0ea5e9"], 23) },
  { id: "mesh-mint", name: "Mint mesh", draw: blobs(["#e8fff4", "#f5ffd6"], ["#34d399", "#d4ff4f", "#7dd3fc"], 31) },
  { id: "bokeh-gold", name: "Golden bokeh", draw: bokeh(["#2a1b0e", "#4a2c12"], "#ffcf70", 3) },
  { id: "bokeh-blue", name: "Blue bokeh", draw: bokeh(["#0b1736", "#1e3a8a"], "#93c5fd", 5) },
  { id: "bokeh-rose", name: "Rose bokeh", draw: bokeh(["#3b0a24", "#7a1846"], "#ffb3d1", 9) },
  { id: "dots-violet", name: "Violet dots", draw: dots("#efebff", "#c4b5fd") },
  { id: "dots-lime", name: "Lime dots", draw: dots("#0f0e17", "#d4ff4f", 0.07, 0.01) },
  { id: "dots-pink", name: "Pink polka", draw: dots("#ffe9f3", "#ff8cc6", 0.12, 0.028) },
  { id: "stripes-candy", name: "Candy stripes", draw: stripes("#ffe9f3", "#ffc2dd") },
  { id: "stripes-sky", name: "Sky stripes", draw: stripes("#e5f6ff", "#bfe6fb", 0.07, 0) },
  { id: "stripes-bold", name: "Bold stripes", draw: stripes("#6d4aff", "#7c5cff", 0.08) },
  { id: "confetti-party", name: "Confetti", draw: confetti("#fff8ef", ["#ff4fa3", "#6d4aff", "#38bdf8", "#ffc93c", "#34d399"], 13) },
  { id: "confetti-night", name: "Night confetti", draw: confetti("#14112b", ["#ff4fa3", "#d4ff4f", "#38bdf8", "#ffc93c"], 17) },
  { id: "memphis", name: "Memphis", draw: memphis("#fff5d6", ["#ff4fa3", "#6d4aff", "#38bdf8", "#0f0e17"], 29) },
  { id: "memphis-dark", name: "Memphis night", draw: memphis("#1e1b4b", ["#ff4fa3", "#d4ff4f", "#38bdf8", "#ffc93c"], 37) },
  { id: "rays-sun", name: "Sunburst", draw: rays("#ffb347", "#ffc56e") },
  { id: "rays-pop", name: "Pop rays", draw: rays("#ff4fa3", "#ff6fb5", 32) },
  { id: "rings", name: "Rings", draw: rings(["#6d4aff", "#8b6dff", "#a993ff"]) },
  { id: "rings-warm", name: "Warm rings", draw: rings(["#ff8a3d", "#ffa863", "#ffc28f"]) },
  { id: "grid-paper", name: "Grid paper", draw: grid("#fbfaf8", "#d9d4e4") },
  { id: "grid-blueprint", name: "Blueprint", draw: grid("#1d4ed8", "#5b84f0", 0.06) },
  { id: "checks", name: "Checks", draw: checks("#ffffff", "#f1eef8") },
  { id: "checks-retro", name: "Retro checks", draw: checks("#0f0e17", "#d4ff4f", 0.125) },
  { id: "waves", name: "Waves", draw: waves("#e5f6ff", "#9ed8f7") },
  { id: "waves-pink", name: "Pink waves", draw: waves("#ffe9f3", "#ffb3d1") },
  { id: "halftone", name: "Halftone", draw: halftone("#fff5d6", "#ff8a3d") },
  { id: "halftone-violet", name: "Violet halftone", draw: halftone("#efebff", "#6d4aff") },
];

export const patternById = (id: string) => patterns.find((p) => p.id === id) ?? patterns[0];

const thumbs = new Map<string, string>();

/** Small data-URL preview for swatches (browser only, cached). */
export function patternThumb(id: string, size = 96): string {
  const key = `${id}@${size}`;
  let url = thumbs.get(key);
  if (!url) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    patternById(id).draw(c.getContext("2d")!, size, size);
    url = c.toDataURL("image/png");
    thumbs.set(key, url);
  }
  return url;
}
