/**
 * Eyewear overlays for the Faces tool, drawn in-house as SVG.
 * Every design uses viewBox 0 0 200 80 with the eyes at (60, 40) and (140, 40), so a design is
 * placed by mapping those two points onto the face's eye landmarks (scale + rotation).
 */
export interface Eyewear {
  id: string;
  name: string;
  svg: string;
}

const wrap = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">${body}</svg>`;

/** 8-bit "deal with it" glasses built from a pixel map. */
function pixelGlasses() {
  const rows = [
    "11111111111111111111111111111111",
    "11111111111111111111111111111111",
    "01112211111111100111112211111110",
    "00112211111111000011122111111100",
    "00011111111110000001111111111000",
    "00001111111100000000111111110000",
  ];
  const px = 6;
  const ox = (200 - rows[0].length * px) / 2;
  const oy = 28;
  let rects = "";
  rows.forEach((r, y) =>
    [...r].forEach((c, x) => {
      if (c === "0") return;
      rects += `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px}" height="${px}" fill="${c === "2" ? "#fff" : "#0f0e17"}"/>`;
    }),
  );
  return rects;
}

export const eyewear: Eyewear[] = [
  {
    id: "bar",
    name: "Classic bar",
    svg: wrap(`<rect x="14" y="24" width="172" height="32" rx="4" fill="#0f0e17"/>`),
  },
  {
    id: "censored",
    name: "Censored",
    svg: wrap(
      `<rect x="10" y="22" width="180" height="36" rx="3" fill="#0f0e17"/>` +
        `<text x="100" y="47" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="17" letter-spacing="3" fill="#fff">CENSORED</text>`,
    ),
  },
  { id: "pixel", name: "Pixel shades", svg: wrap(pixelGlasses()) },
  {
    id: "aviator",
    name: "Aviator",
    svg: wrap(
      `<defs><linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2f2f"/><stop offset="1" stop-color="#8a6b4a"/></linearGradient></defs>` +
        `<path d="M22 28 Q60 18 92 28 Q96 50 78 62 Q56 72 38 62 Q20 50 22 28 Z" fill="url(#av)" stroke="#d4af37" stroke-width="3.5"/>` +
        `<path d="M178 28 Q140 18 108 28 Q104 50 122 62 Q144 72 162 62 Q180 50 178 28 Z" fill="url(#av)" stroke="#d4af37" stroke-width="3.5"/>` +
        `<path d="M92 28 Q100 24 108 28 M92 24 Q100 19 108 24" fill="none" stroke="#d4af37" stroke-width="3"/>` +
        `<path d="M30 32 Q44 28 54 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>` +
        `<path d="M116 32 Q130 28 140 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`,
    ),
  },
  {
    id: "round",
    name: "Round",
    svg: wrap(
      `<circle cx="60" cy="40" r="25" fill="#5b4636" fill-opacity=".72" stroke="#c9a227" stroke-width="3.5"/>` +
        `<circle cx="140" cy="40" r="25" fill="#5b4636" fill-opacity=".72" stroke="#c9a227" stroke-width="3.5"/>` +
        `<path d="M85 38 Q100 30 115 38" fill="none" stroke="#c9a227" stroke-width="3.5"/>` +
        `<path d="M35 36 L12 30 M165 36 L188 30" stroke="#c9a227" stroke-width="3.5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "wayfarer",
    name: "Wayfarer",
    svg: wrap(
      `<path d="M16 22 H94 L88 56 Q84 64 72 64 H40 Q26 64 22 54 Z" fill="#0f0e17"/>` +
        `<path d="M184 22 H106 L112 56 Q116 64 128 64 H160 Q174 64 178 54 Z" fill="#0f0e17"/>` +
        `<path d="M94 28 H106" stroke="#0f0e17" stroke-width="7"/>` +
        `<path d="M24 26 H86 L82 52 Q80 58 72 58 H42 Q32 58 29 51 Z" fill="#2b2b3a"/>` +
        `<path d="M176 26 H114 L118 52 Q120 58 128 58 H158 Q168 58 171 51 Z" fill="#2b2b3a"/>` +
        `<path d="M32 32 L48 32" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`,
    ),
  },
  {
    id: "cat-eye",
    name: "Cat eye",
    svg: wrap(
      `<path d="M8 20 Q40 22 92 30 Q92 56 70 62 Q42 66 30 50 Q20 36 8 20 Z" fill="#ff4fa3"/>` +
        `<path d="M192 20 Q160 22 108 30 Q108 56 130 62 Q158 66 170 50 Q180 36 192 20 Z" fill="#ff4fa3"/>` +
        `<path d="M24 28 Q50 30 84 35 Q84 52 68 56 Q48 59 38 47 Q30 38 24 28 Z" fill="#2a1a2e"/>` +
        `<path d="M176 28 Q150 30 116 35 Q116 52 132 56 Q152 59 162 47 Q170 38 176 28 Z" fill="#2a1a2e"/>` +
        `<path d="M92 32 Q100 28 108 32" fill="none" stroke="#ff4fa3" stroke-width="4"/>`,
    ),
  },
  {
    id: "ski",
    name: "Ski goggles",
    svg: wrap(
      `<defs><linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset=".45" stop-color="#ff4fa3"/><stop offset="1" stop-color="#6d4aff"/></linearGradient></defs>` +
        `<rect x="0" y="34" width="200" height="12" fill="#1f2937"/>` +
        `<path d="M14 26 Q100 8 186 26 Q192 48 176 60 Q140 70 112 58 Q100 52 88 58 Q60 70 24 60 Q8 48 14 26 Z" fill="#111827"/>` +
        `<path d="M22 30 Q100 14 178 30 Q182 46 170 54 Q140 62 114 52 Q100 46 86 52 Q60 62 30 54 Q18 46 22 30 Z" fill="url(#sk)"/>` +
        `<path d="M40 30 Q70 22 96 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`,
    ),
  },
  {
    id: "heart",
    name: "Hearts",
    svg: wrap(
      `<path d="M60 66 C34 50 26 40 26 30 C26 20 34 14 43 14 C50 14 56 18 60 25 C64 18 70 14 77 14 C86 14 94 20 94 30 C94 40 86 50 60 66 Z" fill="#ff2e63" stroke="#fff" stroke-width="3"/>` +
        `<path d="M140 66 C114 50 106 40 106 30 C106 20 114 14 123 14 C130 14 136 18 140 25 C144 18 150 14 157 14 C166 14 174 20 174 30 C174 40 166 50 140 66 Z" fill="#ff2e63" stroke="#fff" stroke-width="3"/>` +
        `<path d="M94 30 Q100 26 106 30" fill="none" stroke="#fff" stroke-width="3"/>` +
        `<path d="M36 28 Q38 21 45 20 M116 28 Q118 21 125 20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
    ),
  },
  {
    id: "star",
    name: "Stars",
    svg: wrap(
      `<path d="M60 10 L68 31 L91 32 L73 46 L80 68 L60 55 L40 68 L47 46 L29 32 L52 31 Z" fill="#ffc93c" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M140 10 L148 31 L171 32 L153 46 L160 68 L140 55 L120 68 L127 46 L109 32 L132 31 Z" fill="#ffc93c" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M89 36 Q100 30 111 36" fill="none" stroke="#fff" stroke-width="3"/>`,
    ),
  },
  {
    id: "3d",
    name: "3D glasses",
    svg: wrap(
      `<rect x="14" y="20" width="172" height="40" rx="8" fill="#fff" stroke="#0f0e17" stroke-width="2"/>` +
        `<rect x="26" y="27" width="64" height="26" rx="4" fill="#ef4444" fill-opacity=".85"/>` +
        `<rect x="110" y="27" width="64" height="26" rx="4" fill="#22d3ee" fill-opacity=".85"/>`,
    ),
  },
  {
    id: "nerd",
    name: "Thick frames",
    svg: wrap(
      `<rect x="20" y="20" width="76" height="42" rx="10" fill="#bfe3ff" fill-opacity=".35" stroke="#0f0e17" stroke-width="8"/>` +
        `<rect x="104" y="20" width="76" height="42" rx="10" fill="#bfe3ff" fill-opacity=".35" stroke="#0f0e17" stroke-width="8"/>` +
        `<path d="M96 36 H104" stroke="#0f0e17" stroke-width="8"/>` +
        `<rect x="93" y="30" width="14" height="12" rx="2" fill="#f5f5f4" stroke="#d6d3d1" stroke-width="1.5"/>` +
        `<path d="M32 30 L44 30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    ),
  },
  {
    id: "visor",
    name: "Visor",
    svg: wrap(
      `<defs><linearGradient id="vz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>` +
        `<path d="M6 30 Q100 14 194 30 L188 52 Q100 40 12 52 Z" fill="url(#vz)" stroke="#e5e7eb" stroke-width="2.5"/>` +
        `<path d="M24 32 Q100 20 176 32" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`,
    ),
  },
  {
    id: "vr",
    name: "VR headset",
    svg: wrap(
      `<rect x="0" y="34" width="200" height="12" fill="#27272a"/>` +
        `<rect x="18" y="14" width="164" height="52" rx="16" fill="#e4e4e7" stroke="#a1a1aa" stroke-width="2"/>` +
        `<rect x="26" y="22" width="148" height="36" rx="11" fill="#18181b"/>` +
        `<path d="M40 30 H80" stroke="#6d4aff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
    ),
  },
  {
    id: "monocle-pair",
    name: "Gold rims",
    svg: wrap(
      `<ellipse cx="60" cy="40" rx="28" ry="22" fill="none" stroke="#d4af37" stroke-width="3"/>` +
        `<ellipse cx="140" cy="40" rx="28" ry="22" fill="none" stroke="#d4af37" stroke-width="3"/>` +
        `<path d="M88 38 Q100 32 112 38 M32 36 L10 32 M168 36 L190 32" fill="none" stroke="#d4af37" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
];

export const eyewearById = (id: string) => eyewear.find((e) => e.id === id) ?? eyewear[0];

const urls = new WeakMap<Eyewear, string>();
/** Data URL for an eyewear design, encoded once (the panel re-renders on every slider step). */
export const eyewearUrl = (e: Eyewear) => {
  let u = urls.get(e);
  if (!u) urls.set(e, (u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(e.svg)}`));
  return u;
};

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadEyewearImage(id: string): Promise<HTMLImageElement> {
  let p = cache.get(id);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = eyewearUrl(eyewearById(id));
    });
    cache.set(id, p);
  }
  return p;
}
