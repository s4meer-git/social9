import type { IconType } from "react-icons";
import {
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaFacebook,
  FaYoutube,
  FaTiktok,
  FaPinterest,
  FaWhatsapp,
} from "react-icons/fa6";

export interface Preset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface Platform {
  id: string;
  name: string;
  icon: IconType;
  /** Tailwind classes for the platform's tile. */
  tint: string;
  /** One line for the platform page. */
  tagline: string;
  tip: string;
  presets: Preset[];
  pinnedTools: string[];
}

/** Sizes last verified: 2026-10. Re-check before launch. */
export const platforms: Platform[] = [
  {
    id: "instagram", name: "Instagram", icon: FaInstagram, tint: "bg-pink-soft",
    tagline: "Sizes for square posts, 4:5 portraits, stories and reels.",
    tip: "Portrait 4:5 photos take up the most space in the feed, so more people notice them.",
    presets: [
      { id: "ig-square", name: "Post 1:1", width: 1080, height: 1080 },
      { id: "ig-portrait", name: "Portrait 4:5", width: 1080, height: 1350 },
      { id: "ig-landscape", name: "Landscape", width: 1080, height: 566 },
      { id: "ig-story", name: "Story / Reel", width: 1080, height: 1920 },
      { id: "ig-profile", name: "Profile", width: 320, height: 320 },
    ],
    pinnedTools: ["resize", "blur-faces", "face-stickers", "grid"],
  },
  {
    id: "linkedin", name: "LinkedIn", icon: FaLinkedin, tint: "bg-sky-soft",
    tagline: "Sizes for profile pictures, banners and posts.",
    tip: "A plain background and a centered face make your profile look more professional.",
    presets: [
      { id: "li-profile", name: "Profile", width: 400, height: 400 },
      { id: "li-banner", name: "Banner", width: 1584, height: 396 },
      { id: "li-post", name: "Post", width: 1200, height: 627 },
      { id: "li-square", name: "Square post", width: 1200, height: 1200 },
    ],
    pinnedTools: ["pfp", "remove-bg", "change-bg", "upscale"],
  },
  {
    id: "x", name: "X", icon: FaXTwitter, tint: "bg-violet-soft",
    tagline: "Sizes for profile pictures, headers and posts.",
    tip: "Your header is cropped differently on phones, so keep any text near the center.",
    presets: [
      { id: "x-profile", name: "Profile", width: 400, height: 400 },
      { id: "x-header", name: "Header", width: 1500, height: 500 },
      { id: "x-post", name: "Post 16:9", width: 1600, height: 900 },
    ],
    pinnedTools: ["pfp", "resize", "blur-faces"],
  },
  {
    id: "facebook", name: "Facebook", icon: FaFacebook, tint: "bg-sky-soft",
    tagline: "Sizes for profile pictures, covers, posts and stories.",
    tip: "Cover photos are cropped on phones, so keep the important parts in the middle.",
    presets: [
      { id: "fb-profile", name: "Profile", width: 320, height: 320 },
      { id: "fb-cover", name: "Cover", width: 851, height: 315 },
      { id: "fb-post", name: "Post", width: 1200, height: 630 },
      { id: "fb-story", name: "Story", width: 1080, height: 1920 },
    ],
    pinnedTools: ["resize", "blur-faces"],
  },
  {
    id: "youtube", name: "YouTube", icon: FaYoutube, tint: "bg-pink-soft",
    tagline: "Sizes for thumbnails, channel banners and profile pictures.",
    tip: "Remove the background and put a bold color behind you, so your thumbnail stands out in search results.",
    presets: [
      { id: "yt-thumb", name: "Thumbnail", width: 1280, height: 720 },
      { id: "yt-banner", name: "Channel banner", width: 2560, height: 1440 },
      { id: "yt-profile", name: "Profile", width: 800, height: 800 },
    ],
    pinnedTools: ["remove-bg", "text", "upscale"],
  },
  {
    id: "tiktok", name: "TikTok", icon: FaTiktok, tint: "bg-mint-soft",
    tagline: "Sizes for full-screen video covers and profile pictures.",
    tip: "Leave some space at the bottom, because captions and buttons cover it.",
    presets: [
      { id: "tt-cover", name: "Video cover", width: 1080, height: 1920 },
      { id: "tt-profile", name: "Profile", width: 200, height: 200 },
    ],
    pinnedTools: ["fit", "resize"],
  },
  {
    id: "pinterest", name: "Pinterest", icon: FaPinterest, tint: "bg-tangerine-soft",
    tagline: "Sizes for standard and long pins.",
    tip: "Pins with a 2:3 shape get the most space in the feed.",
    presets: [
      { id: "pin-standard", name: "Pin 2:3", width: 1000, height: 1500 },
      { id: "pin-long", name: "Long pin", width: 1000, height: 2100 },
    ],
    pinnedTools: ["resize", "text"],
  },
  {
    id: "whatsapp", name: "WhatsApp", icon: FaWhatsapp, tint: "bg-mint-soft",
    tagline: "Sizes for profile pictures, status updates and stickers.",
    tip: "Stickers must be 512 × 512 pixels and saved as WebP. Remove the background first for a clean sticker.",
    presets: [
      { id: "wa-dp", name: "Profile", width: 500, height: 500 },
      { id: "wa-status", name: "Status", width: 1080, height: 1920 },
      { id: "wa-sticker", name: "Sticker", width: 512, height: 512 },
    ],
    pinnedTools: ["pfp", "remove-bg", "compress"],
  },
];
export const platformById = (id: string) => platforms.find((p) => p.id === id);
