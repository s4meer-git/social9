# Social9 Core

The on-device engine behind [Social9](https://social9.s4meer.com), a free photo editor for social media.

Social9 says that **your photos never leave your device**. This repository contains the code
that handles your photos, so you can read it and check the live website against it.

## What's in here

| Folder | What it does |
|---|---|
| [`src/ml`](src/ml) | Loads the AI runtime and models, and runs them in your browser: face detection (YuNet), person cut-out (MODNet), object cut-out (ISNet), upscaling (Real-ESRGAN) and object removal (MI-GAN). Every model is pinned to an exact version and **checked against its SHA-256 hash before it runs**. |
| [`src/image`](src/image) | Opens your photo (JPG, PNG, WebP, AVIF, HEIC) and reads its metadata so the app can show you what will be removed. It also includes the crop and fit math, the Instagram grid splitter, and device limits. |
| [`src/convert`](src/convert) | Writes the saved file: JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO, PDF, SVG, exact file sizes, ZIP. Every file is re-encoded from pixels, so **location, camera and date data are never copied over**. |
| [`src/security`](src/security) | The **Content-Security-Policy** that every Social9 page uses. The browser blocks connections to any host that is not on the list. |
| [`docs`](docs) | [How it works](docs/how-it-works.md) · [Every network request](docs/network.md) · [The AI models](docs/models.md) · [Verify it yourself](docs/verify.md) |

## What isn't in here, and why

The website, the editor's interface, the brand, and the creative presets (backgrounds,
stickers, patterns, gradients) stay in Social9's private repository. Many companies split their
code this way. The code that handles your photos is open, and the rest of the product is private.

The private code can't send your photo anywhere either. The
[Content-Security-Policy](src/security/csp.ts) applies to the whole site, including the parts
that aren't here. Your browser enforces it, and you can read it in your browser's developer tools.

## How it works, in short

1. You pick a photo. It's decoded by your browser, in memory. Nothing is uploaded.
2. The first time you use a smart tool, your browser downloads the AI model once and keeps it
   on your device. Models are open-source, pinned to exact versions, and hash-checked.
3. The AI runs on your device (WebGPU or WebAssembly through ONNX Runtime).
4. When you save, your browser writes a brand-new file from the pixels. The old metadata
   isn't copied, so location and camera details are gone.

The full walk-through is in [docs/how-it-works.md](docs/how-it-works.md).

## Run the tests

```sh
npm install
npm test               # unit tests: encoders, file sizes, face decoding, the security policy
npm run typecheck
npm run verify-models  # downloads every model and checks it against the pinned SHA-256
```

## Report a problem

If you find a way a photo could leave the device, or any other security problem, please see
[SECURITY.md](SECURITY.md).

## License

Apache-2.0, see [LICENSE](LICENSE). The AI models keep their own licenses (MIT and
Apache-2.0); see [docs/models.md](docs/models.md).
