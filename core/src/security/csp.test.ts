import { describe, expect, it } from "vitest";
import { CSP, CSP_DIRECTIVES } from "./csp";

describe("content security policy", () => {
  it("allows the ONNX WASM bootstrap and worker blob URLs", () => {
    expect(CSP_DIRECTIVES["script-src"]).toContain("blob:");
    expect(CSP_DIRECTIVES["script-src"]).toContain("'wasm-unsafe-eval'");
    expect(CSP_DIRECTIVES["worker-src"]).toContain("blob:");
  });
  it("only lets the page talk to the listed file hosts", () => {
    expect(CSP_DIRECTIVES["connect-src"]).toEqual(["'self'", "https://cdn.jsdelivr.net", "https://huggingface.co", "https://*.hf.co"]);
  });
  it("has no catch-all sources", () => {
    for (const [k, v] of Object.entries(CSP_DIRECTIVES)) for (const src of v) expect(src, k).not.toMatch(/^(\*|https?:|https:\/\/\*$)$/);
  });
  it("blocks forms, plugins and framing", () => {
    expect(CSP).toContain("form-action 'none'");
    expect(CSP).toContain("object-src 'none'");
    expect(CSP).toContain("frame-ancestors 'none'");
  });
});
