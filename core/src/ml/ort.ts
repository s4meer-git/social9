import type * as Ort from "onnxruntime-web";

/** Keep in sync with the installed onnxruntime-web (checked by a unit test). */
export const ORT_VERSION = "1.30.0";

/**
 * The runtime and its WebAssembly files load from jsDelivr, pinned to the exact
 * version. The WebGPU wasm is ~28 MB, too big for most static hosts, and the CDN
 * serves it compressed. The service worker caches it for offline use.
 */
export const ORT_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

/** Subresource Integrity for ort.min.js: the browser refuses the script if a single byte differs. */
export const ORT_SRI = "sha384-N94xSNjPDbfBJj4+QINst0nbHpcCm8kc1qNlIP/wA0muqjR3aVyIuDkMeccPrLvQ";

export type OrtModule = typeof Ort;

let loading: Promise<OrtModule> | null = null;

export function loadOrt(): Promise<OrtModule> {
  if (loading) return loading;
  loading = new Promise<OrtModule>((resolve, reject) => {
    const w = window as unknown as { ort?: OrtModule };
    if (w.ort) return resolve(configure(w.ort));
    const script = document.createElement("script");
    script.src = `${ORT_CDN}ort.min.js`;
    script.crossOrigin = "anonymous";
    script.integrity = ORT_SRI;
    script.async = true;
    script.onload = () => (w.ort ? resolve(configure(w.ort)) : reject(new Error("AI runtime failed to start")));
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load the AI runtime. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

function configure(ort: OrtModule): OrtModule {
  ort.env.wasm.wasmPaths = ORT_CDN;
  // Threads need cross-origin isolation (COOP/COEP headers); fall back to one thread.
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
  ort.env.logLevel = "error";
  return ort;
}

let gpu: Promise<boolean> | null = null;

/** True when the browser exposes a usable WebGPU adapter. */
export function hasWebGPU(): Promise<boolean> {
  if (!gpu) {
    gpu = (async () => {
      const nav = navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } };
      if (!nav.gpu) return false;
      try {
        return !!(await nav.gpu.requestAdapter());
      } catch {
        return false;
      }
    })();
  }
  return gpu;
}
