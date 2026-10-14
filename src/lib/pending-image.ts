// Hands a picked file from the landing pages to the editor without uploading it
// anywhere. Lives in module memory, so it survives client-side navigation only.
let pending: File | null = null;

/**
 * A tool page that works in place (profile picture studio, converter) registers here, so
 * every upload route on the page (buttons, drop, paste) feeds it instead of opening the editor.
 */
let inPlace: ((files: File[]) => void) | null = null;

export function setInPlaceHandler(fn: ((files: File[]) => void) | null) {
  inPlace = fn;
}

export function getInPlaceHandler() {
  return inPlace;
}

export function setPendingImage(file: File) {
  pending = file;
}

/** Idempotent read, safe under StrictMode's double-invoked initializers. */
export function peekPendingImage(): File | null {
  return pending;
}

/** Read and clear, so an old hand-off never replaces the photo you're working on. */
export function takePendingImage(): File | null {
  const f = pending;
  pending = null;
  return f;
}

const IMAGE_EXT = /\.(jpe?g|jfif|pjpeg|png|webp|avif|gif|bmp|tiff?|heic|heif)$/i;

/**
 * Loose on purpose: browsers and apps report photos as image/jpg, image/pjpeg, an empty
 * type, or application/octet-stream (common for HEIC). Anything that looks like a photo is
 * let through and the decoder decides; it shows a friendly error if it really can't open it.
 */
export function isAcceptedImage(file: File) {
  if (file.type === "image/svg+xml") return false;
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}
