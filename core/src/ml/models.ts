import type * as Ort from "onnxruntime-web";
import { hasWebGPU, loadOrt } from "./ort";

export interface ModelSpec {
  id: ModelId;
  label: string;
  /** pinned: a self-hosted file, or a Hugging Face file at a fixed commit (never "main") */
  url: string;
  /**
   * SHA-256 of the exact file. A download that doesn't match is refused, so nobody (us
   * included) can swap a model without it showing up in this public file.
   */
  sha256: string;
  /** where the model comes from and its licence */
  source: string;
  license: string;
  /** approximate download size, used until the server reports content-length */
  bytes: number;
  /** "auto" prefers WebGPU when available; "wasm" stays on CPU (tiny models start faster there) */
  device: "auto" | "wasm";
}

export type ModelId = "faces" | "matting" | "objects" | "upscale" | "inpaint";

/** All models are permissively licensed (MIT / Apache-2.0). */
export const MODELS: Record<ModelId, ModelSpec> = {
  faces: {
    id: "faces",
    label: "face detection",
    url: "/models/face_detection_yunet_2023mar.onnx",
    sha256: "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    source: "https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet",
    license: "MIT",
    bytes: 232_589,
    device: "wasm",
  },
  matting: {
    id: "matting",
    label: "background removal",
    url: "/models/modnet_quantized.onnx",
    sha256: "92e49898c3e05a6d7a944fc67a8cb87c4aad754ffb6ebd949528c7d1105fee3a",
    source: "https://huggingface.co/Xenova/modnet (int8)",
    license: "Apache-2.0",
    bytes: 6_632_188,
    // int8 kernels are fastest and most reliable on the CPU backend
    device: "wasm",
  },
  objects: {
    id: "objects",
    label: "object cut-out",
    // ISNet general-use, int8. Used for photos without people. Too big for static hosting
    // (46 MB), so it comes from Hugging Face, pinned to one commit and checked by hash.
    url: "https://huggingface.co/Ko033/isnet-general-use-onnx/resolve/5349b617911fd60c619b52f32e2b593517b78df3/onnx/model_quantized.onnx",
    sha256: "5039225b9a4ac3df55f185d24b7a92d640c86cc4747002d7f23351e394de03a6",
    source: "https://huggingface.co/Ko033/isnet-general-use-onnx",
    license: "Apache-2.0",
    bytes: 45_902_969,
    device: "wasm",
  },
  upscale: {
    id: "upscale",
    label: "upscaling",
    // Real-ESRGAN general x4v3, converted from the official weights by scripts/export-upscaler.py
    url: "/models/realesr-general-x4v3.onnx",
    sha256: "f788518cc66e302bc9b6946016e989dd9374f1012d5b6c0c7e753904ef3f99e4",
    source: "https://github.com/xinntao/Real-ESRGAN (realesr-general-x4v3.pth, converted to ONNX)",
    license: "BSD-3-Clause",
    bytes: 4_866_396,
    // a small convolution network: much faster on the graphics chip, with the CPU as fallback
    device: "auto",
  },
  inpaint: {
    id: "inpaint",
    label: "object removal",
    // MI-GAN by its author, Andranik Sargsyan (Picsart AI Research). 28 MB, so it comes from
    // Hugging Face, pinned to one commit and checked by hash.
    url: "https://huggingface.co/andraniksargsyan/migan/resolve/406830d0fa60666da0071c342ad2fbc8f30c5c64/migan_pipeline_v2.onnx",
    sha256: "6f1f3530a1a2324b19752018ce756088b07973cda8d7d890034ace5c8a48c40b",
    source: "https://huggingface.co/andraniksargsyan/migan",
    license: "MIT",
    bytes: 28_079_181,
    device: "wasm",
  },
};

export type ModelState =
  | { state: "idle" }
  | { state: "downloading"; loaded: number; total: number }
  | { state: "starting" }
  | { state: "ready" }
  | { state: "error"; message: string };

/* Model status, for progress UI. Framework-free: subscribe from any UI library. */
let status: Record<ModelId, ModelState> = { faces: { state: "idle" }, matting: { state: "idle" }, objects: { state: "idle" }, upscale: { state: "idle" }, inpaint: { state: "idle" } };
const listeners = new Set<() => void>();

/** Current status of every model (a new object whenever anything changes). */
export const getModelStatus = () => status;

/** Call `fn` whenever a model's status changes. Returns an unsubscribe function. */
export function subscribeModelStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const setStatus = (id: ModelId, s: ModelState) => {
  status = { ...status, [id]: s };
  listeners.forEach((fn) => fn());
};

/** Hex SHA-256 of some bytes (Web Crypto, runs on the device). */
async function sha256(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}

const CACHE = "social9-models-v2";

/** Download a model with progress, served from Cache Storage after the first time. */
async function fetchModel(spec: ModelSpec): Promise<Uint8Array> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(spec.url);
    if (hit) {
      const bytes = new Uint8Array(await hit.arrayBuffer());
      if ((await sha256(bytes)) === spec.sha256) return bytes;
      await cache.delete(spec.url); // damaged or stale copy: fetch it again
    }
  } catch {
    // Cache Storage unavailable (private mode, old browser): just download.
  }

  const res = await fetch(spec.url, { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status})`);
  const total = Number(res.headers.get("content-length")) || spec.bytes;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    setStatus(spec.id, { state: "downloading", loaded, total: Math.max(total, loaded) });
  }
  const buf = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  // Integrity: only the exact published model may run.
  if ((await sha256(buf)) !== spec.sha256) throw new Error("The AI model didn't pass its integrity check. Please reload and try again.");
  try {
    await cache?.put(spec.url, new Response(buf, { headers: { "content-type": "application/octet-stream" } }));
  } catch {
    // Quota exceeded: still works, it will just download again next time.
  }
  return buf;
}

export async function isModelCached(id: ModelId): Promise<boolean> {
  try {
    return !!(await (await caches.open(CACHE)).match(MODELS[id].url));
  } catch {
    return false;
  }
}

const sessions = new Map<ModelId, Promise<{ ort: typeof Ort; session: Ort.InferenceSession }>>();

/** Shared, lazily created inference session for a model. */
export function getSession(id: ModelId) {
  let p = sessions.get(id);
  if (!p) {
    p = (async () => {
      const spec = MODELS[id];
      try {
        setStatus(id, { state: "downloading", loaded: 0, total: spec.bytes });
        const [ort, bytes, gpu] = await Promise.all([loadOrt(), fetchModel(spec), hasWebGPU()]);
        setStatus(id, { state: "starting" });
        const providers = spec.device === "auto" && gpu ? ["webgpu", "wasm"] : ["wasm"];
        let session: Ort.InferenceSession;
        try {
          session = await ort.InferenceSession.create(bytes, { executionProviders: providers, graphOptimizationLevel: "all", logSeverityLevel: 3 });
        } catch (e) {
          if (providers[0] !== "webgpu") throw e;
          session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"], logSeverityLevel: 3 });
        }
        setStatus(id, { state: "ready" });
        return { ort, session };
      } catch (e) {
        sessions.delete(id);
        setStatus(id, { state: "error", message: e instanceof Error ? e.message : "Something went wrong" });
        throw e;
      }
    })();
    sessions.set(id, p);
  }
  return p;
}
