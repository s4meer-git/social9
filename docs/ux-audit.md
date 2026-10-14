# Social9 UX audit

Every surface walked as a first-time visitor, at 1440px and 390px, with real uploads.
Screenshots: scratchpad `audit/` and `qa/`. Each finding: what the user experiences →
why it matters → decision → status.

Guiding rules used for every decision:
1. **One job per screen.** The first thing you see is the main action for that page.
2. **Simple first.** 2–3 choices up front, the rest behind "More options" / "See all".
3. **Same structure everywhere.** Tools are grouped the same way in the menu, footer,
   homepage and editor: Background · Profile pictures · Faces & privacy · Size · Convert & save.
4. **Nothing snaps.** Content that appears, swaps or loads animates in; long work shows progress.
5. **Every number is true.** Counts come from the data, never hand-typed.

---

## A. Navigation and structure

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| A1 | Mobile menu lists 11 tools as one flat grid | Hard to scan; doesn't match the desktop menu's groups | Group by the 5 categories, same as desktop | fixed |
| A2 | Footer "Tools" is a flat two-column list | Same reason; footer is where people look for "everything" | Group under category headings | fixed |
| A3 | Desktop Tools menu: Profile picture maker was under "Background", location removal under "Privacy" | Grouping didn't match how the editor works | Regrouped to the 5 editor stages | fixed (earlier) |
| A4 | Footer on phones runs ~4 screens | Long scroll to reach legal/support | Link columns two-up on phones, tighter spacing | fixed |
| A5 | Moving between pages is an instant cut | Feels abrupt next to the animated sections | Page-level fade on every route change (`app/template.tsx`) | fixed |

## B. Homepage

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| B1 | Tools shown three times: Showcase slider, "Six tools…" bento, "Pick a tool" grid | Repetition makes the page feel padded and long | Remove the bento; Showcase *shows* results, the grid *lists* every tool | fixed |
| B2 | Numbers seemed to disagree: "Six tools", "9 free tools", "7 platforms, 22 sizes" vs "8 platforms, 26 sizes" | Contradictions kill trust | Checked: the stats row is already computed from data (the screenshot caught it mid count-up). The only wrong number was the bento's hand-typed "Six tools", removed with B1 | fixed |
| B3 | Section order after B1: hero → platforms → reel → showcase → moments → how it works → profile → tools → wall → privacy → FAQ → CTA | Reads as: what it is → see it → why/when → how → do it | Keep | ok |

## C. Tool landing pages

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| C1 | Remove background page: "HD mode: on computers with a modern GPU…" | No longer true (HD runs everywhere) | Rewrite copy | fixed |
| C2 | Hero = headline, one upload button, samples, before/after | Correct: one job | Keep | ok |

## D. Editor

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| D1 | 11 overlapping tools that overwrote each other | Unpredictable results | 5 tools, one pipeline (editor-architecture.md) | fixed (earlier) |
| D2 | Canvas froze when picking a heavy effect | Felt broken | Effects render a beat after the click, "Updating" chip | fixed |
| D3 | Panels and tabs swapped instantly | Jerky | Cross-fade on tool and tab change; staggered swatch reveal | fixed |
| D4 | Export showed "Ready to post" and unexplained platform chips | Chips had no clear meaning | "Thank you" + confetti + quote; "What next" = one clear action per mode | fixed |
| D5 | HD cut-out hung; groups lost heads; dog got a hole; tiny photos blank; transparent PNG re-cut | Core feature failing | Model routing (people / objects / own alpha), speck cleanup | fixed (earlier) |
| D6 | Hidden-data list always open in Save | Noise | Behind "See what's removed"; warning only when the photo really has GPS/date/serial | fixed (earlier) |

## E. Profile picture page

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| E1 | Settings panel didn't scroll with the mouse wheel | Couldn't reach ring/size | Panel flows with the page, preview stays pinned; smooth-scroll lets nested areas scroll | fixed |
| E2 | Download saved silently | No reward moment; inconsistent with the editor | Same "Thank you" dialog (confetti, quote, every-platform ZIP) | fixed |
| E3 | Editing view popped in after upload | Abrupt | Fades up | fixed |

## F. Converter

| # | What the user sees | Why it matters | Decision | Status |
|---|---|---|---|---|
| F1 | Every setting visible at once | Overwhelming | Popular jobs → Format → File size → Pixel size; rest in More options | fixed (earlier) |
| F2 | Nothing visible while big files decode | Looks frozen | "Reading N photos…" card | fixed |
| F3 | Download is silent | Same as E2 | Confetti + thank-you toast | fixed |
| F4 | Settings sticky column could be taller than the screen | Bottom options unreachable | Settings flow with the page, preview pinned | fixed |

## G. Words match the product

| # | What the user reads | Why it matters | Decision | Status |
|---|---|---|---|---|
| G1 | Help page: "hold Space to compare", "export JPG, PNG, WebP", old model sizes | Help that's wrong is worse than none | Rewritten for the 5-tool editor, 10 formats, the 3 models, `\` to compare | fixed |
| G2 | FAQ "export as JPG, PNG or WebP" | Undersells the product | Lists all save formats and exact KB | fixed |
| G3 | Blur faces FAQ: "switch to the manual brush" for missed faces | That feature didn't exist | Built it (G5) and rewrote the answer | fixed |
| G4 | "Choose a different sticker per face", "Four styles", "Adjustable depth", "Gradients and solid colors" | Claims didn't match the UI | Copy now names what's really there (Mix, 15 eyewear, 49 stickers, 6 blur styles, 450+ backgrounds) | fixed |
| G5 | A face the AI misses can't be covered | Privacy tool with a hole in it | "Add a face the AI missed": tap the spot, it gets the same cover; undoable | fixed |
| G6 | 404 page | Friendly, links to the main tools | Keep | ok |

## I. Safari and iPhone

Run in WebKit (Playwright 26.6) as desktop Safari, as iPhone 15, and as an older iPhone with
no canvas `filter` (Safari before 18). Scripts: scratchpad `e2e/wk-flow.mjs`, `wk-studio.mjs`,
`wk-huge.mjs`, `jank.mjs` (frame rate per home section).

| # | What the user sees | Why it happened | Decision | Status |
|---|---|---|---|---|
| I1 | Home page stutters in Safari: hero 17 fps, two sections 30 fps (Chrome: 120 everywhere) | Safari runs `offset-path` animations (110 ribbon letters), 130 px `filter: blur` glows, per-letter `filter: blur` in the headline, and `backdrop-filter` over moving content on the CPU every frame | Ribbon drawn on one canvas; glows are radial gradients; headline letters fade and rise, no blur; badges use solid tints instead of frosted glass | fixed: every section 58–60 fps in WebKit |
| I2 | Ribbon kept costing frames when scrolled out of view | Paused CSS animations with many keyframes still cost style work in WebKit | Canvas loop stops entirely off-screen | fixed |
| I3 | Editor: zoom bar, "Updating" chip and panel header blurred what's behind them | Re-blurred on every pan/zoom in Safari, and swatches showed through the header on iPhone | Solid backgrounds | fixed |
| I4 | Blur backgrounds and mesh patterns on iPhones before iOS 18 | Safari < 18 ignores canvas `filter`, and the old check only tested whether the property exists: blur came out sharp or blocky, mesh blobs as hard circles | Real check (draw and read back a pixel); fallback blur shrinks in halves and grows back for a smooth result; mesh blobs use soft radial gradients; converter grayscale done by hand | fixed (checked with filter disabled) |
| I5 | Converter: changing format and tapping Download right away saved the previous file under the new name (an SVG called .jpg) | Download used the last result while the new one was still being made | Each result remembers the settings it was made with; Download waits until it matches | fixed (desktop Safari exact 50 KB now 51200 bytes) |
| I6 | "Access control checks" errors in Safari's console | Old file links were revoked while the preview was still loading them | Revoke a few seconds later | fixed |
| I7 | SVG with transparency was broken in Safari | It embeds WebP, which Safari can't write, so PNG bytes were labelled WebP | Uses PNG inside the SVG where WebP isn't available | fixed |
| I8 | 48 MP iPhone photos would edit and save as blank images | iPhone Safari won't draw canvases over 16.7 MP | Photos over the limit are scaled down once on open; converter output is capped with a note | fixed (23 MP test photo exports 3659 × 4574) |
| I9 | HEIC photos slow to open on iPhone | Every HEIC went through the large JS decoder | Browser decodes it natively first; JS decoder only as fallback | fixed |
| I10 | Thank-you dialog had a violet outline on iPhone | Focus ring drawn on the dialog box itself | No outline on the dialog (buttons inside keep theirs) | fixed |
| I11 | WebP save greyed out in Safari | Safari can't encode WebP | Shown as unavailable with a reason; AVIF works on current Safari | ok |
| I12 | iPhone: putting two fingers down to zoom while adding a missed face dropped a stray cover | The cover was placed the moment the first finger touched | Placed on a clean tap only; a pinch cancels it | fixed (touch test: brush, pinch 8%→31%, pinch adds nothing, tap adds one) |
| I13 | Dragging the background-blur slider stuttered in Safari (43 fps) | Every step rebuilt the "clean plate" (nine full-size blurs) although it never depends on the blur amount; Safari also runs big canvas blurs on the CPU | Plate cached per photo + cut-out; Safari uses the fast shrink-and-grow blur for large radii | fixed: 58 fps |
| I14 | Tool pages hitched for ~1.5 s after opening in Safari | The before/after slider's intro sweep re-rendered React and repainted a `clip-path` on every frame (the same cost on every drag) | Slider moves with transforms written straight to the DOM; same for the explainer reel wipe and the Tools menu preview wipe | fixed: 14 long frames → 5 (first paint only) |
| I15 | Aurora glow (dark bands, tool heroes) cost Safari a 70 px blur on a moving layer | Filter on an animated element | Soft gradients without the filter, same look | fixed |
| I16 | Privacy diagram was a static picture | Didn't show the story | Short loop: photo flies into the browser, tools follow, the edit plays (cut out → backdrop → profile circle), result flies to "Ready to post"; a pulse bounces off the servers route ("Photos received: 0"). Phones get the same edit in the browser card. Paused off-screen; still for reduced motion | done: 60 fps WebKit, 120 Chrome |
| I17 | Editor sliders lagged in Safari (face strength: 11.6 s of stalls in one drag) | Every change re-composed the whole picture, rebuilding the background blur each step | Layered rendering: photo, background and cut-out are cached and only redrawn when their own settings change; face effects are applied last, only over the faces | fixed: 0 long frames |
| I18 | Faces panel stalled on every slider step | Face thumbnails were re-encoded to JPEG on each step (they depended on the whole frame) | Thumbnails depend on the face list only and are cached | fixed |
| I19 | Sticker/eyewear size sliders lagged | SVG art re-rasterised with a live canvas shadow each step | Art pre-rendered once with its shadow, then scaled | fixed |
| I20 | Opening Save froze for a moment (and again on each edit) | The size estimate re-rendered the full-size picture every time | Full-size render cached per edit; format and size changes only re-encode; Export reuses it | fixed: 399 → 31 ms (iPhone) |
| I21 | Brush strokes hitched with a blurred background | The blur's clean plate was rebuilt for every stroke | Plate built from the AI cut-out, so touch-ups reuse it | fixed |
| I22 | "See all stickers" stalled; images decoded on the main thread site-wide | Default image decoding | `decoding="async"` on every image | fixed: 1.6 s → 0.25 s |
| I23 | Scrolling could feel rubbery; FAQ link overshot by ~630 px | CSS smooth scroll ran on top of Lenis; lazily sized sections moved the target mid-glide | Lenis rules added; anchor glide corrects its landing | fixed: lands exactly |

Verified after fixes: editor (cut-out, transparency, replace, 3 blur styles, brush, stickers,
eyewear, profile, exact 50 KB, export) on Safari and iPhone; profile picture studio (upload,
style, ring, drag, download); converter (all 10 formats with magic bytes checked, exact 50 KB);
home menus and FAQ. Zero console errors on every run.

## J. Layout bugs and plain English (6 Oct)

| # | What the user saw | Cause | Fix | Status |
|---|---|---|---|---|
| J1 | Square size previews on platform pages spilled out of their frame | Previews were sized to the frame's width only | Previews fit both width and height of the frame (container units) | fixed |
| J2 | Hard edge in the purple glow just under the nav on tool, platform, help and 404 pages | Glow was clipped where the page content starts | One shared glow that starts at the top of the page, under the transparent nav; no blur filters | fixed |
| J3 | Footer "social9" wordmark cut flat at the top | Gradient text fill only covered the tight line box | Padding above the letters, offset so nothing moves | fixed |
| J4 | Link underlines cut through descenders ("Privacy policy") | Underline sat too close to the text | Lower, thinner underline everywhere | fixed |
| J5 | User didn't like the person in the Headshot sample and LinkedIn profile cards | Photo choice | New Unsplash headshot, profile picture remade with Social9 (credited) | fixed |
| J6 | Custom size: typing a width and moving to height reset the form | Width applied on blur and re-mounted the form | Applies only when focus leaves the pair, or on Enter | fixed |
| J7 | Person cut-out left a patch of background on a side-angle photo | MODNet weakness on this pose; ISNet is clean | Object model used for the demo; routing improvement still to do | open (see H) |
| J8 | Copy read as stiff and machine-written | Metaphors, slogans, colon-joined sentences, mixed spelling, a few wrong facts | Every page, panel, message and doc rewritten in plain English (US spelling); wrong counts and model lists corrected | fixed |

## K. Four new tools (6 Oct)

| # | Tool | How it works | Checked |
|---|---|---|---|
| K1 | Object remover (editor › Retouch › Erase) | Brush over something; when you lift, MI-GAN (MIT, by its author, 28 MB from Hugging Face, pinned + SHA-256) fills a crop around it; only the painted area changes. Each erase is a photo version, so Undo works | Chrome, Safari, iPhone, under the CSP |
| K2 | Upscale (studio page + editor › Retouch › Upscale) | Real-ESRGAN general x4v3 (BSD-3), converted from the official weights by `core/scripts/export-upscaler.py` (reproducible hash), self-hosted 4.9 MB. Same-size tiles so the GPU path doesn't recompile; without a GPU, big photos at 2× are halved first (≈5× faster) | Chrome, Safari, iPhone |
| K3 | Add text (editor › Text) | Five styles, eight colors, size; font, outline, shadow, capitals, box under More options. Drawn on the framed picture, so it keeps its place when resizing; long captions shrink to fit | Chrome, Safari, iPhone, export |
| K4 | Instagram grid (studio page) | 3 columns, 1–5 rows, 3:4 / 4:5 / square tiles at 1080 wide, drag to frame, tiles numbered in posting order, ZIP named in that order | Chrome, iPhone (6 tiles at 1080 × 1350) |
| K5 | Editor rail went from 5 to 7 tools | Items share the width; fits 375 px and up (scrolls slightly at 360 px) | fixed |
| K6 | Upscaling a 1400 × 1750 photo took ~160 s on one CPU thread | Full 4× work on the CPU | GPU when available; half-size input for 2× without a GPU (≈30 s single-thread, faster with threads on the live site) | improved |

## H. Still to watch

- Editor first paint on slow phones (performance score 91).
- First non-person cut-out downloads a 46 MB model (behind the progress card).
- Real-device check on an iPhone (headless WebKit has no GPU, so its frame rates are a lower bound).
- Person cut-outs (MODNet) can keep background patches on side-angle photos where the object model (ISNet) is clean. Consider running both or falling back automatically.
- Object removal of large areas (or a big brush on a zoomed-out phone screen) can smear. Consider limiting the brush to a sensible size relative to the photo.
