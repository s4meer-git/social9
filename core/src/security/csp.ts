/**
 * The Content-Security-Policy every Social9 page is served with.
 *
 * This is the promise "your photos never leave your device" enforced by the browser rather
 * than by trust: a page may only connect to the hosts listed in `connect-src`, may only
 * load images from itself, and may not submit forms anywhere. Even a bug, or a bad change
 * to the app, could not send a photo to another server; the browser would block it and
 * log the attempt in the console.
 *
 * Every allowed host, and why:
 *   'self'                  the Social9 site: pages, the three small AI models, assets
 *   cdn.jsdelivr.net        the open-source AI runtime (onnxruntime-web), pinned + SRI-checked
 *   huggingface.co, *.hf.co two open models (ISNet, MI-GAN), pinned to commits and
 *                           SHA-256-checked; Hugging Face redirects downloads to its *.hf.co CDN
 *
 * Nothing in this list accepts uploads from the app: they only serve files.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  // ONNX Runtime imports its WASM bootstrap through a locally created blob URL.
  "script-src": ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", "blob:", "https://cdn.jsdelivr.net"],
  "worker-src": ["'self'", "blob:", "https://cdn.jsdelivr.net"],
  "connect-src": ["'self'", "https://cdn.jsdelivr.net", "https://huggingface.co", "https://*.hf.co"],
  "img-src": ["'self'", "data:", "blob:"],
  "media-src": ["'self'", "blob:"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'", "data:"],
  "manifest-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'none'"],
  "frame-ancestors": ["'none'"],
};

/** The policy as a header value. */
export const CSP = Object.entries(CSP_DIRECTIVES)
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .join("; ");

/**
 * The same policy for a <meta http-equiv> tag, so it applies on any host. Browsers ignore
 * (and warn about) frame-ancestors in a meta tag; the HTTP header carries that one.
 */
export const CSP_META = Object.entries(CSP_DIRECTIVES)
  .filter(([k]) => k !== "frame-ancestors")
  .map(([k, v]) => `${k} ${v.join(" ")}`)
  .join("; ");
