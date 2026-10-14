# Social9

The free photo studio for social media. It removes backgrounds, makes profile pictures, blurs or stickers faces, resizes for every platform, converts and compresses, and strips location data.

**Everything runs in the browser.** The AI models run on the user's device through ONNX Runtime Web, using WebGPU when available and WebAssembly otherwise. Photos are never uploaded, and after the first visit the app works offline.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npm run lint
npm run build        # static site in ./out
```

The build is a fully static export (`output: "export"`), so you can host `out/` on any static host. For **Coolify**, use the included Dockerfile: it builds the app and serves `out/` with Nginx on port **8080**, including security headers, cross-origin isolation, caching and a health check. See [the Coolify deployment guide](docs/coolify-deployment.md) for the exact settings and verification steps. Cloudflare Pages and Netlify can also serve `out/` using `public/_headers`.

## How it's organised

| Path | What's there |
|---|---|
| `src/app` | Routes: home, `/editor`, one landing page per tool (`/[slug]`), `/platforms/[id]`, the hidden `/reel` capture page, sitemap, robots and manifest |
| `src/lib/tools.ts` | Tool registry. Landing pages, menus and the editor rail are all generated from it. |
| `src/lib/platforms.ts` | Every platform and its exact sizes |
| `src/editor` | Editor state (Zustand, undo/redo), the render pipeline and export |
| `core/` | **The open-source engine** (published separately on GitHub, Apache-2.0): AI runtime and models with SHA-256 checks, face detection, cut-outs, photo decoding and metadata, the converter and encoders, the Content-Security-Policy. The app imports it as `@social9/core/*`. |
| `src/lib/image` | Compositing (backgrounds, face effects, profile-picture rings). Private: creative presets live here. |
| `src/components/fx` | Locally owned UI effects: spotlight cards, border beam, flip words, tilt, aurora, marquee, number ticker |
| `src/components/home` | Marketing sections, including the code-animated explainer reel |
| `public/sw.js` | Offline service worker |
| `docs/ad-script.md` | Launch ad script, storyboard and AI-video prompts |

## AI models

| Task | Model | Size | Where it loads from |
|---|---|---|---|
| Face detection | YuNet | 0.2 MB | `public/models` (self-hosted) |
| Cut-outs of people | MODNet (int8) | 6.6 MB | `public/models` (self-hosted) |
| Cut-outs of objects, pets, groups | ISNet general-use (int8) | 46 MB | Hugging Face, pinned to a commit |

Every model is pinned by SHA-256 in `core/src/ml/models.ts` and refused if it doesn't match.
Models are kept in Cache Storage (`social9-models-v2`). ONNX Runtime loads from jsDelivr,
pinned and checked with Subresource Integrity.

## Open source

`core/` is the public part: everything that touches a user's photo, plus the security
policy for the whole site. Publish it as its own repository (e.g. with `git subtree split
--prefix core`), and set `SITE.github` in `src/lib/site.ts` to its URL. The `/how-it-works`
page links there.

The Content-Security-Policy is defined in `core/src/security/csp.ts`. It's served from
`public/_headers` and as a `<meta>` tag in production. A unit test fails if the two drift apart.

## Social clips

`node scripts/record-reel.mjs` records the four explainer scenes as MP4 files in 16:9, 9:16 and 1:1, and writes them to `public/reel/video`. It needs the dev server running, plus Chrome and ffmpeg.

## Credits

Photo, model and font licenses are listed in [CREDITS.md](CREDITS.md).
