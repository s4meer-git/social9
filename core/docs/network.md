# Every network request Social9 makes

This is the complete list. It is enforced by the page's
[Content-Security-Policy](../src/security/csp.ts): a request to any other host is blocked
by the browser and reported in the console.

| Host | What | When | Carries your photo? |
|---|---|---|---|
| the Social9 site | pages, scripts, styles, fonts, demo images, three AI models (`/models/*.onnx`) | as you browse; models on first use | No |
| `cdn.jsdelivr.net` | ONNX Runtime Web 1.30.0 (`ort.min.js` + its `.wasm` files) | the first time a smart tool runs | No |
| `huggingface.co` → `*.hf.co` | the ISNet model (commit `5349b61`, 46 MB) and the MI-GAN model (commit `406830d`, 28 MB) | the first time you cut out a non-person photo, or remove an object | No |

There are no other requests. In particular, there is:

- **no analytics or tracking script**, and no tracking cookies
- **no upload endpoint**, and no API that accepts images
- **no third-party fonts, ads or embeds**

## Requests that never happen

Search the code and you won't find any of these:

- `fetch`, `XMLHttpRequest`, `sendBeacon` or `WebSocket` carrying image data
- a `<form>` that submits anywhere (the policy sets `form-action 'none'`)
- images loaded from other sites, which could leak data in a URL (`img-src 'self' data: blob:`)

## Model downloads, exactly

Each model download is a plain `GET` with `credentials: "omit"` and
`referrerPolicy: "no-referrer"` ([`ml/models.ts`](../src/ml/models.ts)), so the host learns
only that someone downloaded a public file, which it serves to everyone.
