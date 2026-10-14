import { ByteWriter, ascii, blobBytes, concat, crc32 } from "./bytes";

/*
 * Encoders for every output format. Browsers give us JPEG/PNG/WebP (and AVIF in some)
 * through canvas.toBlob; BMP, TIFF, ICO, GIF, PDF and SVG are written by hand here.
 * Every encoder starts from a canvas, so metadata from the original file never survives.
 */

export type FormatId = "jpeg" | "png" | "webp" | "avif" | "gif" | "bmp" | "tiff" | "ico" | "pdf" | "svg";

export interface FormatInfo {
  id: FormatId;
  label: string;
  ext: string;
  mime: string;
  /** has a quality knob */
  lossy: boolean;
  alpha: boolean;
  /** one-line help shown in the picker */
  note: string;
}

export const FORMATS: FormatInfo[] = [
  { id: "jpeg", label: "JPG", ext: "jpg", mime: "image/jpeg", lossy: true, alpha: false, note: "Best for photos. Small files that work everywhere" },
  { id: "png", label: "PNG", ext: "png", mime: "image/png", lossy: false, alpha: true, note: "Full quality, keeps transparency" },
  { id: "webp", label: "WebP", ext: "webp", mime: "image/webp", lossy: true, alpha: true, note: "Small files for websites, keeps transparency" },
  { id: "avif", label: "AVIF", ext: "avif", mime: "image/avif", lossy: true, alpha: true, note: "A newer format with the smallest files" },
  { id: "pdf", label: "PDF", ext: "pdf", mime: "application/pdf", lossy: true, alpha: false, note: "For forms, printing and email" },
  { id: "gif", label: "GIF", ext: "gif", mime: "image/gif", lossy: false, alpha: true, note: "256 colors, for simple graphics" },
  { id: "bmp", label: "BMP", ext: "bmp", mime: "image/bmp", lossy: false, alpha: false, note: "Uncompressed image" },
  { id: "tiff", label: "TIFF", ext: "tiff", mime: "image/tiff", lossy: false, alpha: true, note: "Uncompressed, for print" },
  { id: "ico", label: "ICO", ext: "ico", mime: "image/x-icon", lossy: false, alpha: true, note: "Website favicon (16 to 256 px)" },
  { id: "svg", label: "SVG", ext: "svg", mime: "image/svg+xml", lossy: true, alpha: true, note: "Photo wrapped in an SVG file" },
];

export const formatById = (id: FormatId) => FORMATS.find((f) => f.id === id)!;

const nativeCache = new Map<string, boolean>();

/** Whether this browser's canvas can encode a native type (AVIF and WebP vary). */
export function canEncodeNative(mime: string): boolean {
  if (typeof document === "undefined") return true;
  let ok = nativeCache.get(mime);
  if (ok === undefined) {
    const c = document.createElement("canvas");
    c.width = c.height = 2;
    ok = c.toDataURL(mime).startsWith(`data:${mime}`);
    nativeCache.set(mime, ok);
  }
  return ok;
}

export const isAvailable = (id: FormatId) => (id === "webp" || id === "avif" ? canEncodeNative(formatById(id).mime) : true);

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality));
}

function pixels(canvas: HTMLCanvasElement) {
  return canvas.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height).data;
}

/** Copy onto a solid matte (for formats or choices without transparency). */
export function flatten(canvas: HTMLCanvasElement, matte: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = matte;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(canvas, 0, 0);
  return c;
}

/* ── DPI patches for browser-made files ───────────────────────────────── */

/** Set the JFIF density (dots per inch) in a JPEG from canvas. */
function jpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  // canvas JPEGs start FFD8 FFE0 <len> "JFIF\0" <ver2> <units> <xd2> <yd2>
  if (bytes[2] === 0xff && bytes[3] === 0xe0 && String.fromCharCode(...bytes.subarray(6, 10)) === "JFIF") {
    const out = bytes.slice();
    out[13] = 1; // dots per inch
    out[14] = (dpi >> 8) & 0xff;
    out[15] = dpi & 0xff;
    out[16] = (dpi >> 8) & 0xff;
    out[17] = dpi & 0xff;
    return out;
  }
  return bytes;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const w = new ByteWriter(data.length + 12);
  w.u32be(data.length);
  const body = concat([ascii(type), data]);
  w.bytes(body);
  w.u32be(crc32(body));
  return w.result();
}

/** Insert a chunk right after IHDR (PNG). */
function pngInsert(bytes: Uint8Array, chunk: Uint8Array): Uint8Array {
  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  return concat([bytes.subarray(0, ihdrEnd), chunk, bytes.subarray(ihdrEnd)]);
}

function pngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const ppm = Math.round(dpi / 0.0254);
  const d = new ByteWriter(9);
  d.u32be(ppm);
  d.u32be(ppm);
  d.u8(1);
  return pngInsert(bytes, pngChunk("pHYs", d.result()));
}

/* ── hand-written formats ─────────────────────────────────────────────── */

function encodeBmp(canvas: HTMLCanvasElement, dpi: number): Uint8Array {
  const { width: w, height: h } = canvas;
  const px = pixels(canvas);
  const rowSize = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + rowSize * h;
  const out = new ByteWriter(size);
  const ppm = Math.round(dpi / 0.0254);
  out.ascii("BM");
  out.u32le(size);
  out.u32le(0);
  out.u32le(54);
  out.u32le(40);
  out.u32le(w);
  out.u32le(h);
  out.u16le(1);
  out.u16le(24);
  out.u32le(0);
  out.u32le(rowSize * h);
  out.u32le(ppm);
  out.u32le(ppm);
  out.u32le(0);
  out.u32le(0);
  const row = new Uint8Array(rowSize);
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      row[x * 3] = px[i + 2];
      row[x * 3 + 1] = px[i + 1];
      row[x * 3 + 2] = px[i];
    }
    out.bytes(row);
  }
  return out.result();
}

function encodeTiff(canvas: HTMLCanvasElement, dpi: number): Uint8Array {
  const { width: w, height: h } = canvas;
  const px = pixels(canvas);
  const pixelBytes = w * h * 4;
  const entries: [number, number, number, number][] = []; // tag, type, count, value
  const SHORT = 3;
  const LONG = 4;
  const RATIONAL = 5;
  const headerSize = 8;
  const dataStart = headerSize;
  const ifdStart = dataStart + pixelBytes;
  const nEntries = 13;
  const ifdSize = 2 + nEntries * 12 + 4;
  const extra = ifdStart + ifdSize; // bits-per-sample array, then 2 rationals
  entries.push([256, LONG, 1, w]);
  entries.push([257, LONG, 1, h]);
  entries.push([258, SHORT, 4, extra]);
  entries.push([259, SHORT, 1, 1]);
  entries.push([262, SHORT, 1, 2]);
  entries.push([273, LONG, 1, dataStart]);
  entries.push([277, SHORT, 1, 4]);
  entries.push([278, LONG, 1, h]);
  entries.push([279, LONG, 1, pixelBytes]);
  entries.push([282, RATIONAL, 1, extra + 8]);
  entries.push([283, RATIONAL, 1, extra + 16]);
  entries.push([296, SHORT, 1, 2]);
  entries.push([338, SHORT, 1, 2]); // unassociated alpha
  const out = new ByteWriter(extra + 24);
  out.ascii("II");
  out.u16le(42);
  out.u32le(ifdStart);
  out.bytes(px);
  out.u16le(nEntries);
  for (const [tag, type, count, value] of entries) {
    out.u16le(tag);
    out.u16le(type);
    out.u32le(count);
    if (type === SHORT && count === 1) {
      out.u16le(value);
      out.u16le(0);
    } else out.u32le(value);
  }
  out.u32le(0);
  [8, 8, 8, 8].forEach((b) => out.u16le(b));
  out.u32le(dpi);
  out.u32le(1);
  out.u32le(dpi);
  out.u32le(1);
  return out.result();
}

async function encodeIco(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  // PNG-compressed icon entries at the standard sizes up to the source size
  const sizes = [16, 32, 48, 64, 128, 256].filter((s) => s <= Math.max(16, Math.min(256, canvas.width, canvas.height)));
  const pngs: Uint8Array[] = [];
  for (const s of sizes) {
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    const k = Math.min(s / canvas.width, s / canvas.height);
    const dw = canvas.width * k;
    const dh = canvas.height * k;
    ctx.drawImage(canvas, (s - dw) / 2, (s - dh) / 2, dw, dh);
    pngs.push(await blobBytes(await toBlob(c, "image/png")));
  }
  const out = new ByteWriter();
  out.u16le(0);
  out.u16le(1);
  out.u16le(sizes.length);
  let offset = 6 + 16 * sizes.length;
  sizes.forEach((s, i) => {
    out.u8(s >= 256 ? 0 : s);
    out.u8(s >= 256 ? 0 : s);
    out.u8(0);
    out.u8(0);
    out.u16le(1);
    out.u16le(32);
    out.u32le(pngs[i].length);
    out.u32le(offset);
    offset += pngs[i].length;
  });
  pngs.forEach((p) => out.bytes(p));
  return out.result();
}

/* GIF: median-cut-ish palette (popularity on 5-bit color) + LZW */

function gifPalette(px: Uint8ClampedArray, hasAlpha: boolean) {
  const counts = new Map<number, number>();
  for (let i = 0; i < px.length; i += 4) {
    if (hasAlpha && px[i + 3] < 128) continue;
    const key = ((px[i] >> 3) << 10) | ((px[i + 1] >> 3) << 5) | (px[i + 2] >> 3);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, hasAlpha ? 255 : 256);
  const palette = top.map(([k]) => [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4]);
  while (palette.length < 2) palette.push([0, 0, 0]);
  const transparent = hasAlpha ? palette.length : -1;
  if (hasAlpha) palette.push([0, 0, 0]);
  let size = 2;
  while (size < palette.length) size *= 2;
  while (palette.length < size) palette.push([0, 0, 0]);
  return { palette, transparent, bits: Math.log2(size) };
}

function encodeGif(canvas: HTMLCanvasElement): Uint8Array {
  const { width: w, height: h } = canvas;
  const px = pixels(canvas);
  let hasAlpha = false;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 128) { hasAlpha = true; break; }
  const { palette, transparent, bits } = gifPalette(px, hasAlpha);
  const cache = new Map<number, number>();
  const limit = transparent >= 0 ? transparent : palette.length;
  const indices = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (hasAlpha && px[i + 3] < 128) {
      indices[p] = transparent;
      continue;
    }
    const key = ((px[i] >> 2) << 12) | ((px[i + 1] >> 2) << 6) | (px[i + 2] >> 2);
    let best = cache.get(key);
    if (best === undefined) {
      let d = Infinity;
      best = 0;
      for (let k = 0; k < limit; k++) {
        const c = palette[k];
        const dd = (c[0] - px[i]) ** 2 + (c[1] - px[i + 1]) ** 2 + (c[2] - px[i + 2]) ** 2;
        if (dd < d) {
          d = dd;
          best = k;
        }
      }
      cache.set(key, best);
    }
    indices[p] = best;
  }

  const out = new ByteWriter(w * h);
  out.ascii("GIF89a");
  out.u16le(w);
  out.u16le(h);
  out.u8(0xf0 | (bits - 1));
  out.u8(0);
  out.u8(0);
  for (const c of palette) out.bytes(c);
  if (transparent >= 0) {
    out.bytes([0x21, 0xf9, 4, 1, 0, 0, transparent, 0]);
  }
  out.u8(0x2c);
  out.u16le(0);
  out.u16le(0);
  out.u16le(w);
  out.u16le(h);
  out.u8(0);
  const minCode = Math.max(2, bits);
  out.u8(minCode);
  // LZW with numeric (prefix << 8 | pixel) dictionary keys
  const clear = 1 << minCode;
  const eoi = clear + 1;
  let codeSize = minCode + 1;
  let next = eoi + 1;
  let dict = new Map<number, number>();
  const sub: number[] = [];
  let acc = 0;
  let accBits = 0;
  const emit = (code: number) => {
    acc |= code << accBits;
    accBits += codeSize;
    while (accBits >= 8) {
      sub.push(acc & 0xff);
      acc >>>= 8;
      accBits -= 8;
      if (sub.length === 255) {
        out.u8(255);
        out.bytes(sub);
        sub.length = 0;
      }
    }
  };
  emit(clear);
  let prefix = indices[0];
  for (let p = 1; p < indices.length; p++) {
    const k = indices[p];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      // the decoder lags one entry behind, so widen once next passes 2^codeSize
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      dict = new Map();
      next = eoi + 1;
      codeSize = minCode + 1;
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (accBits > 0) sub.push(acc & 0xff);
  if (sub.length) {
    out.u8(sub.length);
    out.bytes(sub);
  }
  out.u8(0);
  out.u8(0x3b);
  return out.result();
}

/* PDF: one page, the image as a JPEG (DCTDecode) */

export type PdfPage = "fit" | "a4" | "letter";

function encodePdf(jpeg: Uint8Array, w: number, h: number, dpi: number, page: PdfPage): Uint8Array {
  const imgW = (w / dpi) * 72;
  const imgH = (h / dpi) * 72;
  let pw = imgW;
  let ph = imgH;
  if (page === "a4") [pw, ph] = imgW > imgH ? [841.89, 595.28] : [595.28, 841.89];
  if (page === "letter") [pw, ph] = imgW > imgH ? [792, 612] : [612, 792];
  let dw = imgW;
  let dh = imgH;
  if (page !== "fit") {
    const margin = 36;
    const k = Math.min(1, (pw - margin * 2) / imgW, (ph - margin * 2) / imgH);
    dw = imgW * k;
    dh = imgH * k;
  }
  const dx = (pw - dw) / 2;
  const dy = (ph - dh) / 2;
  const f = (n: number) => n.toFixed(2);
  const content = `q ${f(dw)} 0 0 ${f(dh)} ${f(dx)} ${f(dy)} cm /Im0 Do Q`;

  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (b: Uint8Array) => {
    parts.push(b);
    pos += b.length;
  };
  const obj = (n: number, body: Uint8Array | string, stream?: Uint8Array) => {
    offsets[n] = pos;
    push(ascii(`${n} 0 obj\n`));
    push(typeof body === "string" ? ascii(body) : body);
    if (stream) {
      push(ascii("\nstream\n"));
      push(stream);
      push(ascii("\nendstream"));
    }
    push(ascii("\nendobj\n"));
  };
  push(ascii("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"));
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(pw)} ${f(ph)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  obj(5, `<< /Length ${content.length} >>`, ascii(content));
  obj(6, "<< /Producer (Social9) >>");
  const xref = pos;
  let table = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) table += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(ascii(table));
  push(ascii(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return concat(parts);
}

function encodeSvg(inner: Uint8Array, mime: string, w: number, h: number): Uint8Array {
  let bin = "";
  for (let i = 0; i < inner.length; i += 0x8000) bin += String.fromCharCode(...inner.subarray(i, i + 0x8000));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" xlink:href="data:${mime};base64,${btoa(bin)}"/></svg>\n`;
  return new TextEncoder().encode(svg);
}

/* ── public API ───────────────────────────────────────────────────────── */

export interface EncodeOptions {
  /** 0..1 for lossy formats */
  quality: number;
  dpi: number;
  /** color behind transparent pixels when the format (or the choice) has no alpha */
  matte: string;
  /** keep transparency when the format supports it */
  keepAlpha: boolean;
  pdfPage: PdfPage;
}

/** Encode a canvas to bytes in any supported format. */
export async function encodeCanvas(canvas: HTMLCanvasElement, format: FormatId, o: EncodeOptions): Promise<Uint8Array> {
  const info = formatById(format);
  const src = !info.alpha || !o.keepAlpha ? flatten(canvas, o.matte) : canvas;
  switch (format) {
    case "jpeg":
      return jpegDpi(await blobBytes(await toBlob(src, "image/jpeg", o.quality)), o.dpi);
    case "png":
      return pngDpi(await blobBytes(await toBlob(src, "image/png")), o.dpi);
    case "webp":
      return blobBytes(await toBlob(src, "image/webp", o.quality));
    case "avif":
      return blobBytes(await toBlob(src, "image/avif", o.quality));
    case "bmp":
      return encodeBmp(src, o.dpi);
    case "tiff":
      return encodeTiff(src, o.dpi);
    case "ico":
      return encodeIco(src);
    case "gif":
      return encodeGif(src);
    case "pdf": {
      const jpg = await blobBytes(await toBlob(flatten(canvas, o.matte), "image/jpeg", o.quality));
      return encodePdf(jpg, canvas.width, canvas.height, o.dpi, o.pdfPage);
    }
    case "svg": {
      // transparent: WebP where the browser can write it (Safari can't), PNG otherwise
      const mime = !o.keepAlpha ? "image/jpeg" : canEncodeNative("image/webp") ? "image/webp" : "image/png";
      const inner = await blobBytes(await toBlob(src, mime, o.quality));
      return encodeSvg(inner, mime, canvas.width, canvas.height);
    }
  }
}

/* ── padding to an exact byte size ────────────────────────────────────── */

/**
 * Grow a file to exactly `target` bytes with format-legal filler (comments, ancillary
 * chunks or trailing data the format ignores). Returns null if it can't be done.
 */
export function padTo(bytes: Uint8Array, format: FormatId, target: number): Uint8Array | null {
  const extra = target - bytes.length;
  if (extra === 0) return bytes;
  if (extra < 0) return null;
  switch (format) {
    case "jpeg": {
      // COM segments after SOI: FFFE + 2-byte length (incl. itself) + payload
      if (extra < 4) return null;
      const segs: Uint8Array[] = [];
      let left = extra;
      while (left > 0) {
        let len = Math.min(left, 65537); // marker(2) + length field covers 2..65535
        if (left - len > 0 && left - len < 4) len = left - 4;
        const payload = len - 4;
        const s = new Uint8Array(len);
        s[0] = 0xff;
        s[1] = 0xfe;
        s[2] = ((payload + 2) >> 8) & 0xff;
        s[3] = (payload + 2) & 0xff;
        s.fill(0x20, 4);
        segs.push(s);
        left -= len;
      }
      return concat([bytes.subarray(0, 2), ...segs, bytes.subarray(2)]);
    }
    case "png": {
      if (extra < 12) return null;
      return pngInsert(bytes, pngChunk("s9Pd", new Uint8Array(extra - 12)));
    }
    case "webp": {
      // extra RIFF chunk, padded to even length; RIFF size updated
      if (extra < 8 || extra % 2) return null;
      const chunk = new ByteWriter(extra);
      chunk.ascii("S9PD");
      chunk.u32le(extra - 8);
      chunk.bytes(new Uint8Array(extra - 8));
      const out = concat([bytes, chunk.result()]);
      const size = out.length - 8;
      out[4] = size & 0xff;
      out[5] = (size >> 8) & 0xff;
      out[6] = (size >> 16) & 0xff;
      out[7] = (size >> 24) & 0xff;
      return out;
    }
    case "avif": {
      // top-level "free" box at the end of the file
      if (extra < 8) return null;
      const box = new ByteWriter(extra);
      box.u32be(extra);
      box.ascii("free");
      box.bytes(new Uint8Array(extra - 8));
      return concat([bytes, box.result()]);
    }
    case "gif": {
      // one comment extension (21 FE, sub-blocks of 1..255 bytes, 00) before the trailer
      if (extra < 5) return null;
      const sizes: number[] = [];
      let left = extra - 3; // bytes taken by sub-blocks, each (1 + n)
      while (left > 0) {
        let take = Math.min(256, left);
        if (left - take === 1) take -= 1; // never leave a 1-byte remainder
        sizes.push(take - 1);
        left -= take;
      }
      const w = new ByteWriter(extra);
      w.bytes([0x21, 0xfe]);
      for (const n of sizes) {
        w.u8(n);
        w.bytes(new Uint8Array(n).fill(0x20));
      }
      w.u8(0);
      return concat([bytes.subarray(0, bytes.length - 1), w.result(), bytes.subarray(bytes.length - 1)]);
    }
    case "pdf":
    case "svg": {
      // comment lines: PDF "%…" after %%EOF is ignored; SVG XML comment
      if (format === "svg") {
        if (extra < 8) return null;
        return concat([bytes, ascii("<!--"), new Uint8Array(extra - 8).fill(0x20), ascii("-->\n")]);
      }
      if (extra < 2) return null;
      return concat([bytes, ascii("%"), new Uint8Array(extra - 2).fill(0x20), ascii("\n")]);
    }
    case "bmp":
    case "tiff":
    case "ico":
      // trailing bytes after the declared data are ignored by readers
      return concat([bytes, new Uint8Array(extra)]);
  }
}
