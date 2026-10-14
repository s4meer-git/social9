/**
 * Face-cover stickers: drawn SVG art (not emoji), each with a white die-cut edge.
 * viewBox is always 0 0 100 100 so they scale to any face box.
 */
export interface Sticker {
  id: string;
  name: string;
  svg: string;
}

const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;

export const stickers: Sticker[] = [
  {
    id: "smile",
    name: "Smiley",
    svg: wrap(
      `<circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="50" cy="50" r="40" fill="#ffc93c"/>` +
        `<ellipse cx="37" cy="42" rx="4.5" ry="7" fill="#0f0e17"/><ellipse cx="63" cy="42" rx="4.5" ry="7" fill="#0f0e17"/>` +
        `<circle cx="27" cy="58" r="6" fill="#ff7ab8" opacity=".55"/><circle cx="73" cy="58" r="6" fill="#ff7ab8" opacity=".55"/>` +
        `<path d="M33 60 Q50 76 67 60" fill="none" stroke="#0f0e17" stroke-width="5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "cool",
    name: "Shades",
    svg: wrap(
      `<circle cx="50" cy="50" r="46" fill="#fff"/><circle cx="50" cy="50" r="40" fill="#ffc93c"/>` +
        `<path d="M18 40 H82 V44 Q80 58 66 58 Q55 58 53 46 H47 Q45 58 34 58 Q20 58 18 44 Z" fill="#0f0e17"/>` +
        `<path d="M27 44 L33 44" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M38 68 Q52 76 64 66" fill="none" stroke="#0f0e17" stroke-width="5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "flower",
    name: "Flower",
    svg: wrap(
      `<g fill="#fff"><circle cx="50" cy="24" r="22"/><circle cx="75" cy="42" r="22"/><circle cx="66" cy="72" r="22"/><circle cx="34" cy="72" r="22"/><circle cx="25" cy="42" r="22"/></g>` +
        `<g fill="#ff8cc6"><circle cx="50" cy="26" r="17"/><circle cx="72" cy="43" r="17"/><circle cx="64" cy="70" r="17"/><circle cx="36" cy="70" r="17"/><circle cx="28" cy="43" r="17"/></g>` +
        `<circle cx="50" cy="50" r="15" fill="#ffc93c"/><circle cx="45" cy="47" r="2.5" fill="#0f0e17"/><circle cx="55" cy="47" r="2.5" fill="#0f0e17"/>` +
        `<path d="M44 54 Q50 59 56 54" fill="none" stroke="#0f0e17" stroke-width="2.5" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "cat",
    name: "Cat",
    svg: wrap(
      `<path d="M10 92 L10 30 L28 6 L42 26 H58 L72 6 L90 30 L90 92 Z" fill="#fff"/>` +
        `<path d="M16 86 L16 32 L29 14 L40 31 H60 L71 14 L84 32 L84 86 Z" fill="#ff9f43"/>` +
        `<path d="M24 31 L29 21 L34 29 Z M66 29 L71 21 L76 31 Z" fill="#ffd7b0"/>` +
        `<ellipse cx="36" cy="52" rx="5" ry="7" fill="#0f0e17"/><ellipse cx="64" cy="52" rx="5" ry="7" fill="#0f0e17"/>` +
        `<path d="M46 62 H54 L50 67 Z" fill="#ff5c8a"/>` +
        `<path d="M50 67 Q44 74 38 70 M50 67 Q56 74 62 70" fill="none" stroke="#0f0e17" stroke-width="2.5" stroke-linecap="round"/>` +
        `<path d="M22 60 H34 M22 66 H34 M66 60 H78 M66 66 H78" stroke="#0f0e17" stroke-width="2" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "alien",
    name: "Alien",
    svg: wrap(
      `<path d="M50 4 C82 4 94 28 90 50 C86 74 66 96 50 96 C34 96 14 74 10 50 C6 28 18 4 50 4 Z" fill="#fff"/>` +
        `<path d="M50 10 C78 10 88 30 84 50 C80 70 63 90 50 90 C37 90 20 70 16 50 C12 30 22 10 50 10 Z" fill="#7be37b"/>` +
        `<path d="M22 46 C26 36 40 38 44 52 C40 60 26 58 22 46 Z M78 46 C74 36 60 38 56 52 C60 60 74 58 78 46 Z" fill="#0f0e17"/>` +
        `<circle cx="32" cy="46" r="3" fill="#fff"/><circle cx="68" cy="46" r="3" fill="#fff"/>` +
        `<path d="M44 74 Q50 78 56 74" fill="none" stroke="#0f0e17" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "heart",
    name: "Heart",
    svg: wrap(
      `<path d="M50 94 C22 74 4 58 4 34 C4 16 18 4 32 4 C40 4 46 8 50 14 C54 8 60 4 68 4 C82 4 96 16 96 34 C96 58 78 74 50 94 Z" fill="#fff"/>` +
        `<path d="M50 86 C26 68 11 55 11 35 C11 21 22 11 33 11 C41 11 47 16 50 23 C53 16 59 11 67 11 C78 11 89 21 89 35 C89 55 74 68 50 86 Z" fill="#ff4f7b"/>` +
        `<path d="M24 30 Q26 21 35 19" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`,
    ),
  },
  {
    id: "star",
    name: "Star",
    svg: wrap(
      `<path d="M50 2 L63 34 L98 37 L71 59 L80 94 L50 75 L20 94 L29 59 L2 37 L37 34 Z" fill="#fff"/>` +
        `<path d="M50 11 L60 38 L89 41 L67 59 L74 87 L50 71 L26 87 L33 59 L11 41 L40 38 Z" fill="#6d4aff"/>` +
        `<circle cx="43" cy="52" r="3.5" fill="#fff"/><circle cx="57" cy="52" r="3.5" fill="#fff"/>` +
        `<path d="M44 61 Q50 66 56 61" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    ),
  },
  {
    id: "blob",
    name: "Blob",
    svg: wrap(
      `<path d="M52 4 C78 2 98 24 94 52 C90 80 70 98 46 96 C20 94 2 74 6 46 C10 20 28 6 52 4 Z" fill="#fff"/>` +
        `<path d="M52 11 C74 9 90 28 87 52 C84 75 67 90 47 89 C25 88 11 71 14 47 C17 25 32 13 52 11 Z" fill="#38bdf8"/>` +
        `<circle cx="38" cy="44" r="9" fill="#fff"/><circle cx="62" cy="44" r="9" fill="#fff"/>` +
        `<circle cx="40" cy="46" r="4.5" fill="#0f0e17"/><circle cx="64" cy="46" r="4.5" fill="#0f0e17"/>` +
        `<ellipse cx="51" cy="66" rx="7" ry="5" fill="#0f0e17"/>`,
    ),
  },
];

/**
 * 3D sticker pack: Microsoft Fluent Emoji 3D (MIT), with a white die-cut edge added.
 * Files: /public/stickers/3d/{id}.webp. Ids are prefixed "3d:" everywhere else.
 */
const fluent: [string, string][] = [
  ["smiling-face-with-sunglasses", "Cool"],
  ["star-struck", "Starstruck"],
  ["partying-face", "Party"],
  ["smiling-face-with-hearts", "Hearts"],
  ["nerd-face", "Nerd"],
  ["cowboy-hat-face", "Cowboy"],
  ["disguised-face", "Disguise"],
  ["zany-face", "Zany"],
  ["winking-face", "Wink"],
  ["upside-down-face", "Upside down"],
  ["clown-face", "Clown"],
  ["alien", "Alien"],
  ["robot", "Robot"],
  ["ghost", "Ghost"],
  ["jack-o-lantern", "Pumpkin"],
  ["sun-with-face", "Sun"],
  ["full-moon-face", "Moon"],
  ["new-moon-face", "New moon"],
  ["cat-face", "Cat"],
  ["dog-face", "Dog"],
  ["panda", "Panda"],
  ["fox", "Fox"],
  ["bear", "Bear"],
  ["koala", "Koala"],
  ["tiger-face", "Tiger"],
  ["rabbit-face", "Bunny"],
  ["hamster", "Hamster"],
  ["pig-face", "Piggy"],
  ["frog", "Frog"],
  ["penguin", "Penguin"],
  ["unicorn", "Unicorn"],
  ["see-no-evil-monkey", "No peeking"],
  ["teddy-bear", "Teddy"],
  ["hatching-chick", "Chick"],
  ["sunflower", "Sunflower"],
  ["cherry-blossom", "Blossom"],
  ["hibiscus", "Hibiscus"],
  ["red-heart", "Heart"],
  ["glowing-star", "Star"],
  ["diya-lamp", "Diya"],
  ["birthday-cake", "Cake"],
];

export interface StickerOption {
  id: string;
  name: string;
  url: string;
  pack: "3d" | "drawn";
}

export const stickerOptions: StickerOption[] = [
  ...fluent.map(([id, name]) => ({ id: `3d:${id}`, name, url: `/stickers/3d/${id}.webp`, pack: "3d" as const })),
  ...stickers.map((s) => ({ id: s.id, name: s.name, url: stickerUrl(s), pack: "drawn" as const })),
];

/** "Mix" puts a different sticker on each face, in this order. */
export const MIX = ["3d:smiling-face-with-sunglasses", "3d:panda", "3d:partying-face", "3d:cat-face", "3d:star-struck", "3d:fox", "3d:nerd-face", "3d:unicorn"];

export const stickerById = (id: string) => stickers.find((s) => s.id === id) ?? stickers[0];

export function stickerUrl(s: Sticker) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.svg)}`;
}

const urlFor = (id: string) => (id.startsWith("3d:") ? `/stickers/3d/${id.slice(3)}.webp` : stickerUrl(stickerById(id)));

const imageCache = new Map<string, Promise<HTMLImageElement>>();

/** Decoded <img> for drawing a sticker onto a canvas (drawn SVG or 3D WebP). Cached. */
export function loadStickerImage(id: string): Promise<HTMLImageElement> {
  let p = imageCache.get(id);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = urlFor(id);
    });
    imageCache.set(id, p);
  }
  return p;
}
