import type { IconType } from "react-icons";
import {
  FaScissors,
  FaFillDrip,
  FaCircleHalfStroke,
  FaUserTie,
  FaCropSimple,
  FaExpand,
  FaUserSecret,
  FaFaceSmile,
  FaFileImage,
  FaCompress,
  FaLocationDot,
  FaEraser,
  FaMagnifyingGlassPlus,
  FaFont,
  FaTableCells,
} from "react-icons/fa6";

export type CategoryId = "background" | "profile" | "resize" | "privacy" | "enhance" | "create" | "utility";
export type Tier = "live" | "soon";

export interface Category {
  id: CategoryId;
  name: string;
  /** Full Tailwind class strings so the compiler picks them up. */
  fill: string;
  soft: string;
  text: string;
}

export const categories: Record<CategoryId, Category> = {
  background: { id: "background", name: "Background", fill: "bg-violet text-white", soft: "bg-violet-soft", text: "text-violet-deep" },
  profile: { id: "profile", name: "Profile pictures", fill: "bg-tangerine text-ink", soft: "bg-tangerine-soft", text: "text-orange-700" },
  resize: { id: "resize", name: "Size", fill: "bg-sky text-ink", soft: "bg-sky-soft", text: "text-sky-700" },
  privacy: { id: "privacy", name: "Faces & privacy", fill: "bg-pink text-white", soft: "bg-pink-soft", text: "text-pink-deep" },
  enhance: { id: "enhance", name: "Enhance", fill: "bg-sun text-ink", soft: "bg-sun-soft", text: "text-amber-700" },
  create: { id: "create", name: "Create", fill: "bg-tangerine text-ink", soft: "bg-tangerine-soft", text: "text-orange-700" },
  utility: { id: "utility", name: "Convert & save", fill: "bg-mint text-ink", soft: "bg-mint-soft", text: "text-emerald-700" },
};

export interface Demo {
  before: string;
  after: string;
  /** show a checkerboard behind the "after" image (transparent output) */
  checker?: boolean;
  ratio: string;
}

export interface Tool {
  id: string;
  name: string;
  /** one line for cards */
  blurb: string;
  /** URL segment of the tool's landing page */
  slug: string;
  category: CategoryId;
  icon: IconType;
  tier: Tier;
  demo?: Demo;
  headline: string;
  intro: string;
  features: { title: string; text: string }[];
  faq: { q: string; a: string }[];
}

const privacyFaq = {
  q: "Do you upload my photos?",
  a: "No. Every tool runs in your browser, on your own device. Your photos are never sent to a server, and nothing is kept after you close the tab.",
};

export const tools: Tool[] = [
  {
    id: "remove-bg",
    name: "Remove background",
    blurb: "Get a clean cut-out in seconds, even around hair.",
    slug: "remove-background",
    category: "background",
    icon: FaScissors,
    tier: "live",
    demo: { before: "/demo/cutout-before.webp", after: "/demo/cutout-after.webp", checker: true, ratio: "4/5" },
    headline: "Remove the background from any photo",
    intro: "Get a transparent PNG in a few seconds. It handles hair and soft edges, and everything happens on your device.",
    features: [
      { title: "Clean edges", text: "Loose strands of hair and soft edges are kept, so the cut-out looks natural." },
      { title: "People, pets and products", text: "Social9 picks the right AI model for each photo. Portraits get finer hair, and products and pets get clean outlines. Turn on HD for even more detail." },
      { title: "Ready to use", text: "Save it as a transparent PNG, or add a new background straight away." },
    ],
    faq: [
      privacyFaq,
      { q: "What file do I get?", a: "A PNG with a transparent background. It is the same size as your photo, or any platform size you choose." },
      { q: "Is it free?", a: "Yes. There is no sign-up, no credits and no watermark." },
    ],
  },
  {
    id: "change-bg",
    name: "Change background",
    blurb: "Replace it with a color, a gradient or a new scene.",
    slug: "change-background",
    category: "background",
    icon: FaFillDrip,
    tier: "live",
    demo: { before: "/demo/swap-before.webp", after: "/demo/swap-after.webp", ratio: "4/5" },
    headline: "Change your photo's background",
    intro: "Replace the background with a solid color, a soft gradient, a scenic photo or a photo of your own.",
    features: [
      { title: "Over 450 backgrounds", text: "Gradients, solid colors, patterns and photos. You can also pick any color you like." },
      { title: "Scenic photos", text: "Choose one of our scenic photos, or use a photo of your own as the background." },
      { title: "Works at any size", text: "Resize for any platform afterwards. You won't need to redo the cut-out." },
    ],
    faq: [privacyFaq, { q: "Can I use my own background?", a: "Yes. In the Background tool, open Replace, tap Yours and choose any image on your device." }],
  },
  {
    id: "blur-bg",
    name: "Blur background",
    blurb: "Add a portrait-mode blur to any photo.",
    slug: "blur-background",
    category: "background",
    icon: FaCircleHalfStroke,
    tier: "live",
    demo: { before: "/demo/blurbg-before.webp", after: "/demo/blurbg-after.webp", ratio: "4/5" },
    headline: "Blur the background of any photo",
    intro: "Add a soft, portrait-mode blur behind the person or object, so they stand out.",
    features: [
      { title: "Six blur styles", text: "Soft, lens, radial, motion, zoom and tilt-shift. You can set the strength of each one." },
      { title: "The subject stays sharp", text: "Faces and hair stay crisp. Only the background is blurred." },
      { title: "Hide a messy room", text: "Blur a cluttered background before you post." },
    ],
    faq: [privacyFaq],
  },
  {
    id: "pfp",
    name: "Profile picture maker",
    blurb: "Profile pictures for LinkedIn, Instagram, X and more.",
    slug: "profile-picture-maker",
    category: "profile",
    icon: FaUserTie,
    tier: "live",
    demo: { before: "/demo/pfp-1-before.webp", after: "/demo/pfp-1.webp", ratio: "1/1" },
    headline: "Make a profile picture in seconds",
    intro: "Remove the background, add a color or gradient, center your face and add a ring. It is sized correctly for every platform.",
    features: [
      { title: "Centered automatically", text: "Social9 finds your face and places it in the middle of each platform's circle." },
      { title: "Over 450 backgrounds", text: "Gradients, colors, patterns and photos. Choose a professional look for LinkedIn or something fun for Instagram." },
      { title: "Rings", text: "Add a colored ring so your picture stands out in comments and feeds." },
    ],
    faq: [
      privacyFaq,
      { q: "What size should a profile picture be?", a: "LinkedIn uses 400 × 400 pixels, Instagram 320 × 320, X 400 × 400 and WhatsApp 500 × 500. Choose the platform and Social9 sets the size for you." },
    ],
  },
  {
    id: "resize",
    name: "Resize for any platform",
    blurb: "Sizes for posts, stories, banners and thumbnails.",
    slug: "resize-image",
    category: "resize",
    icon: FaCropSimple,
    tier: "live",
    headline: "Resize photos for every social platform",
    intro: "Turn one photo into a square post, a 4:5 portrait, a 9:16 story or a 16:9 thumbnail. Drag the photo to choose what stays in the frame.",
    features: [
      { title: "Official sizes", text: "Sizes for Instagram, LinkedIn, X, Facebook, YouTube, TikTok, Pinterest and WhatsApp." },
      { title: "Crop or fit", text: "Crop the photo to fill the frame, or fit the whole photo and fill the space around it with a blur or a color." },
      { title: "The right pixel size", text: "Your photo is saved at the size each platform expects, so it won't be cropped again when you upload it." },
    ],
    faq: [privacyFaq, { q: "Will my photo lose quality?", a: "No. Social9 saves your photo at full quality from the original. You can also set a maximum file size." }],
  },
  {
    id: "fit",
    name: "Fit without cropping",
    blurb: "Change the shape without cropping your photo.",
    slug: "fit-image",
    category: "resize",
    icon: FaExpand,
    tier: "live",
    headline: "Fit your whole photo into any ratio",
    intro: "Keep your whole photo and fill the empty space around it with a soft blur or a color.",
    features: [
      { title: "Blurred fill", text: "A blurred copy of your photo fills the space around it. This works well for stories." },
      { title: "Color or transparent", text: "Fill the space with a color that matches your feed, or leave it transparent." },
      { title: "Any shape", text: "Square, portrait, story, landscape or a custom size." },
    ],
    faq: [privacyFaq],
  },
  {
    id: "blur-faces",
    name: "Blur faces",
    blurb: "Find faces automatically, then blur or pixelate them.",
    slug: "blur-faces",
    category: "privacy",
    icon: FaUserSecret,
    tier: "live",
    demo: { before: "/demo/group-before.webp", after: "/demo/group-blur.webp", ratio: "3/2" },
    headline: "Blur faces in photos automatically",
    intro: "Posting a group photo? Social9 finds every face. Choose whose faces to hide, then blur, pixelate or cover them.",
    features: [
      { title: "Finds every face", text: "It works on group photos and on small faces in the background." },
      { title: "You decide who is hidden", text: "Tap a face to keep it visible. Every other face is hidden." },
      { title: "Choose a style", text: "Blur, pixelate, 15 kinds of glasses or 49 stickers." },
    ],
    faq: [privacyFaq, { q: "What if it misses a face?", a: "Very small, blurry or turned-away faces can be missed. Tap Add a face the AI missed, then tap the face on your photo to cover it." }],
  },
  {
    id: "face-stickers",
    name: "Face stickers",
    blurb: "Cover faces with fun stickers.",
    slug: "face-stickers",
    category: "privacy",
    icon: FaFaceSmile,
    tier: "live",
    demo: { before: "/demo/group-before.webp", after: "/demo/group-stickers.webp", ratio: "3/2" },
    headline: "Cover faces with stickers",
    intro: "Keep your friends anonymous in a fun way. Choose a sticker and it is placed on every face you pick.",
    features: [
      { title: "Placed automatically", text: "Each sticker is sized and placed on a face for you." },
      { title: "49 stickers", text: "Use one sticker for everyone, or choose Mix for a different sticker on each face." },
      { title: "Faces stay private", text: "Stickers cover each face completely." },
    ],
    faq: [privacyFaq],
  },
  {
    id: "convert",
    name: "Image converter",
    blurb: "Change the format, pixel size or file size.",
    slug: "convert-image",
    category: "utility",
    icon: FaFileImage,
    tier: "live",
    headline: "Convert images to any format and exact size",
    intro: "Convert to JPG, PNG, WebP, AVIF, PDF, GIF, BMP, TIFF, ICO or SVG. Set the pixel size, print size or file size, and convert many photos at once.",
    features: [
      { title: "10 formats", text: "Open iPhone HEIC photos and save them as JPG, PNG, WebP, AVIF, PDF, GIF, BMP, TIFF, ICO or SVG." },
      { title: "Pixel or print size", text: "Type a size like 600 × 600 pixels, or 3.5 × 4.5 cm at 300 DPI." },
      { title: "Exact file size", text: "Keep files under a limit or within a range, or make them exactly 50 KB." },
      { title: "Many photos at once", text: "Add as many photos as you like, choose your settings once and download them all as a ZIP file." },
    ],
    faq: [
      privacyFaq,
      { q: "Can it make a file exactly 50 KB?", a: "Yes. Choose Exact size and type the size. Social9 finds the best quality below that size, then adds a few empty bytes that image viewers ignore, so the file is exactly the size you asked for." },
      { q: "What settings should I use for exam and job forms?", a: "Use the Exam form photo option. It makes a 3.5 × 4.5 cm JPG at 200 DPI, between 20 and 50 KB. For signatures, use the Signature option, which makes a file between 10 and 20 KB." },
    ],
  },
  {
    id: "compress",
    name: "Compress to KB",
    blurb: "Make a photo the exact file size you need.",
    slug: "compress-image",
    category: "utility",
    icon: FaCompress,
    tier: "live",
    headline: "Compress photos to an exact KB size",
    intro: "Need a photo under 50 KB for a form, between 20 and 50 KB, or exactly 100 KB? Set the size and Social9 finds the sharpest version that fits. It works for one photo or many.",
    features: [
      { title: "Maximum, range or exact size", text: "For example, under 200 KB, between 20 and 50 KB, or exactly 100 KB." },
      { title: "Keeps the pixel size when it can", text: "Social9 lowers the quality first. It only makes the photo smaller if that is not enough." },
      { title: "See the size before you save", text: "You can see the final size of every file before you download it." },
      { title: "Many photos at once", text: "Compress a whole folder of photos and download them together as a ZIP file." },
    ],
    faq: [
      privacyFaq,
      { q: "Is 1 KB 1000 or 1024 bytes?", a: "Social9 counts 1 KB as 1024 bytes, which is how most upload forms check file sizes. This means a 50 KB file from Social9 will not be rejected for being too large." },
    ],
  },
  {
    id: "remove-exif",
    name: "Remove location data",
    blurb: "Remove GPS and camera details before you post.",
    slug: "remove-location-data",
    category: "utility",
    icon: FaLocationDot,
    tier: "live",
    headline: "Remove GPS location from photos",
    intro: "Photos taken on a phone often contain the exact place they were taken. See what is hidden in your photo and save a copy without it.",
    features: [
      { title: "See what is hidden", text: "GPS location, the date it was taken, the camera model and its serial number." },
      { title: "Removed automatically", text: "Every photo you save from Social9 is saved without these details." },
      { title: "Nothing is uploaded", text: "Your photo is checked and cleaned on your device." },
    ],
    faq: [privacyFaq],
  },
  {
    id: "object-remover",
    name: "Object remover",
    blurb: "Brush over something to remove it.",
    slug: "object-remover",
    category: "enhance",
    icon: FaEraser,
    tier: "live",
    demo: { before: "/demo/erase-before.webp", after: "/demo/erase-after.webp", ratio: "4/5" },
    headline: "Remove objects from photos",
    intro: "Brush over a person, a sign or anything else you don't want in your photo, and it is removed. Everything happens on your device.",
    features: [
      { title: "Easy to use", text: "Brush over the thing you want to remove. It is removed as soon as you lift your finger or mouse." },
      { title: "Fills in the background", text: "The AI fills the space with what was most likely behind the object, so the photo still looks natural." },
      { title: "Undo at any time", text: "If you don't like the result, press Undo and try again with a different brush stroke." },
    ],
    faq: [
      privacyFaq,
      { q: "What works best?", a: "Small and medium objects on simple backgrounds, such as a sign, a bin or a person in the distance. Large objects in front of busy backgrounds are harder to fill in." },
    ],
  },
  {
    id: "upscale",
    name: "Upscale image",
    blurb: "Make photos up to 4 times bigger and sharper.",
    slug: "upscale-image",
    category: "enhance",
    icon: FaMagnifyingGlassPlus,
    tier: "live",
    demo: { before: "/demo/upscale-before.webp", after: "/demo/upscale-after.webp", ratio: "1/1" },
    headline: "Make photos bigger and sharper",
    intro: "Upscale a small or blurry photo to 2 or 4 times its size. The AI adds detail, so the bigger photo stays sharp.",
    features: [
      { title: "2× or 4×", text: "Choose how much bigger you want your photo. You see the new size before you start." },
      { title: "Sharper details", text: "The AI sharpens edges and textures instead of just stretching the pixels." },
      { title: "Private", text: "Your photo is upscaled on your device and never uploaded." },
    ],
    faq: [
      privacyFaq,
      { q: "How big can the photo be?", a: "The result can be up to 4096 pixels on its longest side. Upscaling works best on photos smaller than 1500 pixels." },
    ],
  },
  {
    id: "text",
    name: "Add text",
    blurb: "Add captions to your photos.",
    slug: "add-text",
    category: "create",
    icon: FaFont,
    tier: "live",
    demo: { before: "/demo/text-before.webp", after: "/demo/text-after.webp", ratio: "3/4" },
    headline: "Add text to your photos",
    intro: "Add a caption in one of five styles, change its color and size, and drag it into place.",
    features: [
      { title: "Five styles", text: "Bold, Clean, Caption box, Highlight and Classic. Each one is easy to read on any photo." },
      { title: "Drag to place", text: "Move your text anywhere on the photo with your finger or mouse." },
      { title: "Stays in place", text: "Your text keeps its position when you resize the photo for another platform." },
    ],
    faq: [privacyFaq, { q: "Can I add more than one caption?", a: "Yes. Tap Add another text to add as many captions as you like." }],
  },
  {
    id: "grid",
    name: "Instagram grid",
    blurb: "Split one photo into a grid for your profile.",
    slug: "instagram-grid-maker",
    category: "create",
    icon: FaTableCells,
    tier: "live",
    headline: "Split a photo into an Instagram grid",
    intro: "Turn one photo into 3, 6, 9 or more posts that join up on your Instagram profile. The tiles are numbered, so you know which one to post first.",
    features: [
      { title: "Numbered tiles", text: "Each tile shows a number, and the files are named in the order you should post them." },
      { title: "Shapes that line up", text: "3:4 tiles match how Instagram shows posts on your profile. 4:5 and square tiles are available too." },
      { title: "Choose what's in the grid", text: "Drag your photo to choose which part goes into the grid, and pick from 1 to 5 rows." },
    ],
    faq: [
      privacyFaq,
      { q: "In what order do I post the tiles?", a: "Start with tile 1 and finish with the last one. Tile 1 ends up at the bottom right of your grid, and the last tile ends up at the top left." },
    ],
  },
];

export const liveTools = tools.filter((t) => t.tier === "live");
export const toolById = (id: string) => tools.find((t) => t.id === id);
export const toolBySlug = (slug: string) => liveTools.find((t) => t.slug === slug);

/** The one grouping used everywhere (menu, footer, homepage), matching the editor's tools. */
export const toolGroups = (["background", "enhance", "profile", "create", "privacy", "resize", "utility"] as const).map((c) => ({ cat: categories[c], items: liveTools.filter((t) => t.category === c) }));
