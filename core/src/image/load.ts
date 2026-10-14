import { fitCanvasLimit } from "./limits";

const isHeic = (file: File) => /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);

/** Decode any supported file into an ImageBitmap, respecting EXIF orientation. */
export async function decodeImage(file: File): Promise<ImageBitmap> {
  let bmp: ImageBitmap;
  try {
    // Safari (and anything else that can) decodes HEIC itself: much faster than the JS decoder
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (e) {
    if (!isHeic(file)) throw e;
    // Loaded on demand: the HEIC decoder is large and most photos don't need it.
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/png" });
    bmp = await createImageBitmap(Array.isArray(out) ? out[0] : out, { imageOrientation: "from-image" });
  }
  // Too big for this device's canvas (48 MP photos on iPhone): scale down once, here
  const k = fitCanvasLimit(bmp.width, bmp.height);
  if (k >= 1) return bmp;
  const c = document.createElement("canvas");
  c.width = Math.floor(bmp.width * k);
  c.height = Math.floor(bmp.height * k);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return createImageBitmap(c);
}

export interface MetaItem {
  label: string;
  value: string;
  sensitive: boolean;
}

/** Summarise the metadata a photo carries, so people can see what gets removed. */
export async function readMetadata(file: File): Promise<MetaItem[]> {
  try {
    const exifr = (await import("exifr")).default;
    const data = await exifr.parse(file, { gps: true, tiff: true, exif: true });
    if (!data) return [];
    const items: MetaItem[] = [];
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      items.push({ label: "GPS location", value: `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`, sensitive: true });
    }
    const date = data.DateTimeOriginal ?? data.CreateDate;
    if (date instanceof Date) items.push({ label: "Date taken", value: date.toLocaleString(), sensitive: true });
    const camera = [data.Make, data.Model].filter(Boolean).join(" ");
    if (camera) items.push({ label: "Camera", value: camera, sensitive: false });
    if (data.LensModel) items.push({ label: "Lens", value: String(data.LensModel), sensitive: false });
    if (data.Software) items.push({ label: "Software", value: String(data.Software), sensitive: false });
    if (data.SerialNumber || data.BodySerialNumber) {
      items.push({ label: "Camera serial", value: String(data.SerialNumber ?? data.BodySerialNumber), sensitive: true });
    }
    return items;
  } catch {
    return [];
  }
}
