/**
 * iPhone and iPad Safari refuse canvases larger than 16.7 megapixels (4096 × 4096): they
 * silently draw nothing. Other browsers allow far more. A 48 MP iPhone photo is over it.
 */
export const isIOS = () =>
  typeof navigator !== "undefined" && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

/** Largest canvas area (pixels) that's safe to draw into on this device. */
export const maxCanvasPixels = () => (isIOS() ? 16_777_216 : 268_435_456);

/** Scale factor (≤ 1) that brings w × h within the device's canvas limit. */
export const fitCanvasLimit = (w: number, h: number) => Math.min(1, Math.sqrt(maxCanvasPixels() / Math.max(1, w * h)) * 0.999);
