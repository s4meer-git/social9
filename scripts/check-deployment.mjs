import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Run against a local Docker container or the public HTTPS deployment.
const base = new URL(process.argv[2] ?? "http://localhost:8080");
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
const globalHeaders = headers.replace(/\r\n/g, "\n").split("/*\n")[1].split("\n/sw.js")[0]
  .split("\n").filter((line) => line.trim()).map((line) => {
    const colon = line.indexOf(":");
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  });

async function check(path, { status = 200, cache = "no-cache", options = {} } = {}) {
  const res = await fetch(new URL(path, base), {
    signal: AbortSignal.timeout(15_000),
    ...options,
  });
  assert.equal(res.status, status, `${path}: HTTP status`);
  assert.equal(res.headers.get("cache-control"), cache, `${path}: caching`);
  for (const [name, value] of globalHeaders) {
    assert.equal(res.headers.get(name), value, `${path}: ${name}`);
  }
  return res;
}

assert.equal(await (await check("/healthz")).text(), "ok\n");

const sitemap = await (await check("/sitemap.xml")).text();
const pages = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname).concat("/reel"))];
assert.ok(pages.includes("/") && pages.includes("/editor"), "Sitemap must include home and editor");
let home;
for (const route of pages) {
  const res = await check(route);
  assert.match(res.headers.get("content-type"), /^text\/html/);
  const html = await res.text();
  assert.match(html, /<html/);
  if (route === "/") home = html;
}

// These routes also have directories containing Next's navigation payloads.
await check("/editor?tool=resize");
const redirect = await check("/editor/?tool=resize", { status: 301, options: { redirect: "manual" } });
assert.ok(redirect.headers.get("location").startsWith("/"), "Redirect must preserve the public proxy origin");
assert.equal(new URL(redirect.headers.get("location"), base).pathname, "/editor");
assert.equal(new URL(redirect.headers.get("location"), base).search, "?tool=resize");

for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/sw.js"]) {
  await (await check(path)).arrayBuffer();
}

// Check real exported RSC payloads, including per-segment navigation data.
const payloads = ["editor.txt", "editor/__next._tree.txt", "editor/__next._index.txt", "editor/__next._full.txt", "editor/__next.editor.__PAGE__.txt"];
for (const file of payloads) {
  const res = await check(`/${file}?_rsc=deployment-check`);
  assert.match(await res.text(), /(?:^|\n)[0-9a-f]+:/, `${file}: navigation payload`);
}

const immutable = "public, max-age=31536000, immutable";
const js = home.match(/<script[^>]+src="(\/_next\/static\/[^"]+\.js)"/)?.[1];
assert.ok(js, "Build must contain JavaScript");
await (await check(js, { cache: immutable })).arrayBuffer();

const model = await check("/models/modnet_quantized.onnx", {
  status: 206, cache: immutable, options: { headers: { Range: "bytes=0-31" } },
});
assert.match(model.headers.get("content-range"), /^bytes 0-31\/\d+$/);
assert.equal((await model.arrayBuffer()).byteLength, 32);

await check("/this-page-does-not-exist", { status: 404 });
await check("/_next/static/missing.js", { status: 404 });
await check("/models/missing.onnx", { status: 404 });
await check("/_headers", { status: 404 });
console.log(`Deployment checks passed: ${pages.length} pages, navigation payloads, headers, cache rules, model range requests and 404s (${base.origin}).`);
