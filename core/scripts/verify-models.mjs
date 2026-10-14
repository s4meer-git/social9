// Downloads every model the app uses and checks its SHA-256 against src/ml/models.ts.
// Usage: npm run verify-models -- https://social9.s4meer.com   (the site to fetch self-hosted models from)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const site = process.argv[2] ?? "https://social9.s4meer.com";
const src = readFileSync(new URL("../src/ml/models.ts", import.meta.url), "utf8");
const models = [...src.matchAll(/url:\s*"([^"]+)",\s*sha256:\s*"([0-9a-f]{64})"/g)].map(([, url, sha]) => ({ url, sha }));
if (!models.length) throw new Error("No models found in models.ts");

let ok = true;
for (const m of models) {
  const url = m.url.startsWith("/") ? new URL(m.url, site).href : m.url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const got = createHash("sha256").update(Buffer.from(await res.arrayBuffer())).digest("hex");
  const pass = got === m.sha;
  ok &&= pass;
  console.log(`${pass ? "OK  " : "FAIL"} ${m.url}\n     expected ${m.sha}\n     got      ${got}`);
}
process.exit(ok ? 0 : 1);
