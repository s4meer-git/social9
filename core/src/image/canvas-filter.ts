/**
 * Does ctx.filter actually blur? Older Safari exposes the property but ignores it, so test by
 * drawing: blur a single pixel and see whether its neighbour picked up colour. Cached.
 */
let filterWorks: boolean | null = null;
export const canFilter = () => {
  if (filterWorks !== null) return filterWorks;
  if (typeof document === "undefined") return false;
  const c = document.createElement("canvas");
  c.width = c.height = 9;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx || !("filter" in ctx)) return (filterWorks = false);
  ctx.filter = "blur(2px)";
  ctx.fillStyle = "#000";
  ctx.fillRect(4, 4, 1, 1);
  filterWorks = ctx.getImageData(2, 4, 1, 1).data[3] > 0;
  return filterWorks;
};

/**
 * Safari (and every iPhone browser, which all run on WebKit) applies canvas filters on the
 * CPU, so a big blur on a full photo stalls for a long frame. There the shrink-and-grow blur
 * is several times faster and looks the same at large radii.
 */
let webkit: boolean | null = null;
export const slowCanvasFilter = () => {
  if (webkit !== null) return webkit;
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return (webkit = ios || (/Safari\//.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua)));
};

/** Use ctx.filter for this blur radius? Small radii stay on the filter everywhere (soft edges). */
export const filterBlurFits = (radius: number) => canFilter() && (radius < 6 || !slowCanvasFilter());
