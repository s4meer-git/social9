# How it works

What happens to a photo from the moment you pick it to the moment you save it. Every step
runs in your browser; links point to the code that does it.

## 1. Opening the photo

[`image/load.ts`](../src/image/load.ts) → `decodeImage(file)`

- The browser reads the file you picked straight from your disk into memory. It is not
  uploaded. There is no upload code anywhere in Social9, and the
  [security policy](../src/security/csp.ts) would block one.
- The browser's own decoder turns it into pixels (`createImageBitmap`), respecting the
  photo's rotation. iPhone HEIC photos use the browser's decoder where available, and a
  bundled HEIC decoder otherwise.
- Photos bigger than the device can draw (16.7 megapixels on iPhones) are scaled down once,
  here, so editing never silently produces a blank image ([`image/limits.ts`](../src/image/limits.ts)).

`readMetadata(file)` reads the photo's EXIF data **only to show you** what's in it (GPS
location, date, camera, serial number) and what will be removed. It is never sent anywhere.

## 2. Getting the AI models (once)

[`ml/models.ts`](../src/ml/models.ts) → `getSession(id)`

| Model | Used for | Size | Comes from |
|---|---|---|---|
| YuNet | finding faces | 0.2 MB | the Social9 site |
| MODNet (int8) | cutting out people | 6.6 MB | the Social9 site |
| ISNet (int8) | cutting out objects, pets, groups | 46 MB | Hugging Face, pinned to one commit |
| Real-ESRGAN | upscaling | 4.9 MB | the Social9 site |
| MI-GAN | removing objects | 28 MB | Hugging Face, pinned to one commit |

- A model is downloaded the first time a tool needs it, then kept in your browser's Cache
  Storage, so it works offline afterwards.
- **Every model is checked against its SHA-256** (written in `models.ts`) before it's used,
  both after downloading and when loading from the cache. A file that doesn't match is
  refused. Swapping a model would require changing this public file.
- The AI runtime ([ONNX Runtime Web](https://onnxruntime.ai), open source by Microsoft) loads
  from jsDelivr at a pinned version, with **Subresource Integrity**. The browser refuses the
  script if a single byte differs ([`ml/ort.ts`](../src/ml/ort.ts)).

Downloads are plain file requests. They send no photo, no cookies and no referrer.

## 3. The AI runs on your device

- **Faces** ([`ml/faces.ts`](../src/ml/faces.ts), [`ml/yunet.ts`](../src/ml/yunet.ts)): the
  photo is shrunk to 640 px, YuNet finds faces and eye positions, and boxes are mapped back.
- **Cut-outs** ([`ml/matting.ts`](../src/ml/matting.ts)): `plan()` picks the model. People
  use MODNet, while groups, pets, products and photos without faces use ISNet. Photos that
  are already transparent use their own transparency. The result is a mask, the same size
  as your photo.
- Inference uses WebGPU (your graphics chip) when available, otherwise WebAssembly on the CPU.

## 4. Editing

Backgrounds, blur, stickers, cropping and profile rings are drawn with the browser's canvas.
That code lives in the app (it's mostly creative presets), but it does no networking and is
bound by the same security policy.

## 5. Saving

[`convert/pipeline.ts`](../src/convert/pipeline.ts) → `convert(canvas, spec)`

- Your browser writes a **brand-new file from the pixels**. JPG, PNG, WebP and AVIF use the
  browser's encoders. GIF, BMP, TIFF, ICO, PDF and SVG are written by our own code in
  [`convert/encoders.ts`](../src/convert/encoders.ts).
- Because the file is made from pixels, **none of the original metadata is copied**. There is no GPS,
  no date, no camera, no serial number. The only header added is print resolution (DPI)
  when you ask for one.
- "Exact size" goals (e.g. exactly 50 KB for a form) are met by choosing the quality, then
  padding with format-legal filler (a JPEG comment, a PNG chunk…). See `padTo()`.
- The file is handed to your browser's download, or to your phone's share sheet. It still
  goes nowhere else.

## 6. What the browser enforces

[`security/csp.ts`](../src/security/csp.ts)

Every page is served with a Content-Security-Policy that lists the only hosts the page may
connect to. These are the Social9 site, jsDelivr (the AI runtime) and Hugging Face (two models).
None of them accept uploads from the app. The policy also blocks form submissions, plugins, outside
images and framing. See [network.md](network.md) for every request the app makes.
