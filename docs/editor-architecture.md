# Social9 editor architecture

Internal design note. Read this before adding a tool or changing how edits combine.

## 1. Why the old editor clashed

The old editor had 11 rail tools that wrote to overlapping settings, and each one ran
setup side effects when selected:

| Clash | Cause |
|---|---|
| Remove BG / New BG / Blur BG overwrote each other | three tools, one setting (`bg.mode`) |
| Blur faces and Stickers cancelled each other | two tools, one setting (`fx.effect`) |
| Profile pic silently changed the size, crop and background | `selectTool("pfp")` applied a preset, forced crop mode and set a gradient |
| Resize presets broke an open profile picture | the size tool didn't know profile mode existed |
| Fit mode and background modes looked like duplicates | "fill the empty space" and "background" were both called background |
| Selecting a tool started heavy AI work | AI jobs were side effects of navigation |

## 2. The rule: one pipeline, fixed order, each stage owned by one tool

Every edit is a parameter on one stage of a single, non-destructive render pipeline.
The order never changes, so tools can be used in any order and still combine
predictably. A tool is just a panel that edits its own stage.

```
 source photo (decoded, EXIF-rotated)
   │
 ⓪ RETOUCH        erase objects (MI-GAN) | upscale (Real-ESRGAN). These are the only
   │              destructive steps: each makes a new photo version; the frame's
   │              `photo` field says which version is shown, so undo moves between them
   │                                              owner: Retouch
 ① CUT-OUT        mask = AI matte (fast | HD)  ⊕  brush strokes (keep / erase)
   │                                              owner: Background › Refine
 ② FACE PIXELS    blur | pixelate, applied to the photo itself (before ③,
   │              so a new background never shows through a blurred face)
   │                                              owner: Faces
 ③ BACKGROUND     original | transparent | color | gradient | pattern | photo | blur(type, amount)
   │              composited under the subject using the refined mask from ①
   │                                              owner: Background
 ④ OVERLAYS       stickers (pack, size) | eyewear (style, size), drawn on top of
   │              everything, tracked to face landmarks
   │                                              owner: Faces
 ⑤ FRAME          output size (preset | custom), fill frame (crop, zoom, pan)
   │              or whole photo (scale, position, fill: blurred | color | transparent)
   │                                              owner: Size
 ⑤b TEXT          captions, drawn on the framed picture in output fractions, so they
   │              keep their place when the size changes
   │                                              owner: Text
 ⑥ PROFILE        circle mask + ring, only when profile mode is on
   │                                              owner: Profile
 ⑦ SAVE           format, quality, exact/target file size, DPI, metadata strip
                                                  owner: Save (and the Convert studio)
```

`compose()` implements ①–④ in source pixels. `renderFrame()` is ⑤, `drawTexts()` is ⑤b and
`decoratePfp()` is ⑥.
`exportImage()` is ⑦. The preview and the export run the same code at different scales.

## 3. Tools (rail) and what they own

| Rail tool | Tabs / sections | Owns | Landing pages that open it |
|---|---|---|---|
| **Background** | Remove · Replace · Blur · Refine (brush) | ① ③ | remove-background, change-background, blur-background |
| **Retouch** | Erase · Upscale | ⓪ | object-remover (upscale-image has its own studio) |
| **Faces** | Blur · Pixelate · Eyewear · Stickers | ② ④ | blur-faces, face-stickers |
| **Text** | text, style, color, size; font, outline, shadow, box under More options | ⑤b | add-text |
| **Profile** | platform, background, ring, shape, face size | ⑥, plus it *requests* ⑤ and ③ (see rules) | profile-picture-maker |
| **Size** | platform + presets, custom W×H, fill frame / whole photo | ⑤ | resize-image, fit-image |
| **Save** | format, quality, size target, privacy report | ⑦ | convert-image, compress-image, remove-location-data |

The 15 public tools stay as landing pages (SEO). Each maps to a rail tool and a tab
(`toolRoute` in `src/editor/tools.ts`).

## 4. Allowed and disallowed combinations

**Rule A: selecting a tool never changes the photo.** Opening a panel only shows controls.
The exceptions are explicit, one-time defaults applied when the stage is still untouched:

| On first open… | …and only if | Default applied |
|---|---|---|
| Background › Remove | `bg.mode == original` | `bg.mode = transparent` (starts the cut-out) |
| Background › Replace | `bg.mode ∈ {original, transparent}` | first gradient |
| Background › Blur | `bg.mode != blur` | gaussian, 50% |
| Faces | `fx.effect == none` | the tab's effect |
| Profile | profile mode off | turn it on (see Rule C) |

**Rule B: AI work is lazy and shared.** The cut-out runs only when a stage needs it
(① for Background and Profile). Face detection runs for Faces and Profile. Results are
cached per photo and survive tool switches, undo and redo.

**Rule C: profile mode is a frame mode, not a filter.**
- On: output becomes the platform's profile size (square), framing is "fill frame",
  centered on the largest face. If the background is still the original, a gradient is suggested
  and applied once.
- While on, **Size** shows only square profile sizes and a "Leave profile mode" button.
  It cannot switch to "whole photo" (a circle crop of a letterboxed photo is never wanted).
- Off: the previous frame (size, mode, zoom, pan) is restored from before profile mode.

**Rule D: one setting, one owner.** Background blur (③) and "blurred fill" (⑤ whole-photo
fill) are different things. ③ blurs behind the subject inside the photo; ⑤ fills empty space
outside the photo. Both may be on at once.

**Rule E: overlays need faces, pixels need faces.** Faces tabs disable themselves with a
clear message when no face is found. Hidden faces (`kept[]`) apply to every face effect.

**Rule F: Save never edits the picture.** Format/size settings only affect encoding.
Transparency + JPG → flattened onto a chosen matte color, with a visible note.

| Combination | Allowed? | Notes |
|---|---|---|
| Cut-out + any background + faces + any size | ✅ | the normal chain |
| Brush refine before or after choosing a background | ✅ | strokes live in ①, everything downstream updates |
| Background blur + whole-photo blurred fill | ✅ | Rule D |
| Profile mode + whole photo | ❌ | Size hides it; leave profile mode first |
| Profile mode + non-square size | ❌ | only profile presets shown |
| Stickers + eyewear on the same face | ❌ | one overlay style per photo (tabs are exclusive) |
| Blur/pixelate + stickers | ❌ | one face style per photo (tabs are exclusive) |
| Transparent bg/clear fill + JPG | ⚠️ | allowed, flattened onto the matte color, with a note |
| HD cut-out while the fast one runs | ❌ | quality switch is disabled while busy |

## 4b. Which cut-out model runs

| Photo | Model | Why |
|---|---|---|
| Already has a see-through background | none, its own alpha is the mask | never re-cut finished cut-outs |
| Exactly one confident face (score ≥ 0.8), short side ≥ 320 px | MODNet (6.6 MB, self-hosted) | best hair on single portraits |
| Groups, pets, products, no face, or under 320 px | ISNet general-use int8 (46 MB, Hugging Face) | MODNet drops heads in groups and fails on small or non-person photos |
| You choose Person / Object (More options) | that one | manual override |

HD = the same model at twice the resolution (MODNet short side up to 1024). A 1024² BiRefNet was
tested and rejected: it exceeds browser WASM memory and breaks ORT's WebGPU shader limits.
Disconnected specks under 4% of the main subject are removed; "No clear subject found" shows
when the cut-out keeps under 1% of the photo.

## 4c. Panels: simple first

Every panel shows the 2–3 choices most people need. Everything else goes behind one
"More options" toggle (`MoreOptions`), closed by default. Long pickers show a short popular
set first with "See all" / "Browse all".

## 5. Canvas

- **View zoom** (5%–800%), plus two-finger pinch on touch screens is separate from the output crop zoom. Controls: floating bar
  at the bottom (− slider + / Fit / 100%), Ctrl/⌘ + wheel, pinch. When zoomed past fit,
  hold Space (or use the hand) to pan the view.
- **Pointer modes**: `move` (drag the photo inside the frame, the default), `brush`
  (Background › Refine), `tap` (Faces: tap a face to keep or hide it).
- Compare (hold the eye button or the `\` key) shows the original.

## 6. History

Everything in `Frame` is undoable, including brush strokes (stored as vectors in source
pixels, so they are resolution-independent). AI results are not history; they're caches.

Retouch makes photo versions (bitmaps), and `Frame.photo` points at one. Each version keeps its
own AI results, so undoing an erase brings back the old cut-out instantly. Upscaling scales the
cut-out, faces and brush strokes with the photo. At most 6 versions are kept (phones have little
memory); the original is never dropped.

## 7. Standalone studios

Profile pictures and conversion are the two jobs people come to do in one step, so their
canonical pages host the tool itself, not a marketing hero:

- `/profile-picture-maker`: PFP studio (upload → styled DP in one screen). It shares the
  editor store, so "More edits" opens `/editor?tool=pfp` with the same state.
- `/instagram-grid-maker`: Grid studio. Splits one photo into a 3-column grid (1–5 rows,
  3:4, 4:5 or square tiles), numbered in posting order, downloaded as a ZIP.
- `/upscale-image`: Upscale studio. 2× or 4× with Real-ESRGAN, before/after close-up.
- `/convert-image` and `/compress-image`: Convert studio. It works on many files at once
  and lets you set an exact pixel size, file size (≤ max, ≥ min, or exactly N KB), DPI,
  format (JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG) and quality. "Edit in Social9"
  sends one file to the editor.

## 8. Asset packs

| Pack | Count | Source | Licence |
|---|---|---|---|
| Face stickers: drawn | 8 | in-house SVG | ours |
| Face stickers: 3D | 41 | Microsoft Fluent Emoji 3D | MIT |
| Eyewear | 12+ | in-house SVG, landmark-tracked | ours |
| Profile backgrounds: gradients | 100+ | uiGradients | MIT |
| Profile backgrounds: patterns | 20+ | generated in code | ours |
| Profile backgrounds: photos | 20+ | Unsplash | Unsplash License |
