/**
 * Chat-wallpaper style doodle pattern (in the spirit of messaging-app chat
 * backgrounds): original line drawings, widely spaced, very faint.
 * Every doodle is drawn on a 24×24 grid and placed by hand on a large tile.
 */
const doodles: Record<string, string> = {
  camera: `<rect x="2.5" y="7" width="19" height="13" rx="3.5"/><path d="M8.5 7l1.6-2.6h3.8L15.5 7"/><circle cx="12" cy="13.5" r="3.6"/><circle cx="17.6" cy="10" r=".6"/>`,
  heart: `<path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.7a4.4 4.4 0 0 1 7.5 2.7c0 5.5-7.5 10.1-7.5 10.1z"/>`,
  photo: `<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3.5 16.5l5-5 4 4 2.5-2.5 5.5 5.5"/><circle cx="15.5" cy="9" r="1.6"/>`,
  scissors: `<circle cx="6" cy="17.5" r="2.8"/><circle cx="6" cy="6.5" r="2.8"/><path d="M8.3 8.2L20 17.5M8.3 15.8L20 6.5"/>`,
  crop: `<path d="M6.5 2.5v15h15"/><path d="M2.5 6.5h15v15"/>`,
  plane: `<path d="M21.5 2.5L2.5 10.2l7.4 2.9 2.9 7.4z"/><path d="M9.9 13.1l11.6-10.6"/>`,
  note: `<path d="M9 18.2V5.5l11-2.2v12.4"/><circle cx="6.6" cy="18.2" r="2.4"/><circle cx="17.6" cy="15.7" r="2.4"/>`,
  smile: `<circle cx="12" cy="12" r="9.5"/><path d="M8 14.2c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/><path d="M9 9.6v.6M15 9.6v.6"/>`,
  star: `<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>`,
  pin: `<path d="M12 21.5s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0c0 5-6.5 11.2-6.5 11.2z"/><circle cx="12" cy="10.2" r="2.4"/>`,
  cloud: `<path d="M7 18.5h10.2a4.3 4.3 0 0 0 .4-8.6A6 6 0 0 0 6.2 11a3.8 3.8 0 0 0 .8 7.5z"/>`,
  chat: `<path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9.5L6 21v-3.5H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5z"/><path d="M7 10h10M7 13.2h6"/>`,
  shades: `<path d="M2.5 9.5h19"/><path d="M3.5 9.5c0 3.6 1.6 5.2 3.9 5.2s3.6-1.8 3.6-5.2M13 9.5c0 3.4 1.3 5.2 3.6 5.2s3.9-1.6 3.9-5.2"/><path d="M11 10.5c.6-.5 1.4-.5 2 0"/>`,
  flower: `<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c-1.6-3.4.1-6 0-6s1.6 2.6 0 6zM14.4 12c3.4-1.6 6 .1 6 0s-2.6 1.6-6 0zM12 14.4c1.6 3.4-.1 6 0 6s-1.6-2.6 0-6zM9.6 12c-3.4 1.6-6-.1-6 0s2.6-1.6 6 0z"/>`,
};

/** [doodle, x, y, rotation, scale] on a 440×440 tile; loosely scattered, no two touching. */
const layout: [keyof typeof doodles, number, number, number, number][] = [
  ["camera", 30, 28, -12, 1.5],
  ["heart", 190, 52, 10, 1.15],
  ["photo", 318, 18, 8, 1.45],
  ["note", 110, 128, -8, 1.1],
  ["smile", 262, 150, 6, 1.3],
  ["scissors", 388, 128, 22, 1.2],
  ["star", 22, 214, 14, 1.15],
  ["cloud", 158, 238, -4, 1.4],
  ["pin", 330, 252, -10, 1.2],
  ["plane", 72, 330, 18, 1.25],
  ["shades", 222, 340, -6, 1.35],
  ["chat", 362, 362, 8, 1.2],
  ["crop", 252, 54, 0, 0.9],
  ["flower", 30, 400, -14, 1.05],
];

export function doodlePattern(color = "#0f0e17", opacity = 0.075, strokeWidth = 1.5) {
  const items = layout
    .map(([name, x, y, r, s]) => `<g transform="translate(${x} ${y}) rotate(${r} 12 12) scale(${s})">${doodles[name]}</g>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 440 440"><g fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${items}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
