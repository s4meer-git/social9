import { mkdir, readFile, writeFile } from "node:fs/promises";

// Keep Coolify's HTTP security/isolation headers identical to the static hosts.
// Location-specific caching is handled by the map in deploy/nginx.conf.
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
let global = false;
const directives = [];
for (const line of headers.split(/\r?\n/)) {
  if (!line.trim() || line.trimStart().startsWith("#")) continue;
  if (!/^\s/.test(line)) {
    global = line.trim() === "/*";
    continue;
  }
  if (!global) continue;
  const match = line.trim().match(/^([\w-]+):\s*(.+)$/);
  if (!match) throw new Error(`Invalid global header: ${line}`);
  const [, name, value] = match;
  const escaped = value.replace(/[\\"$]/g, "\\$&");
  directives.push(`add_header ${name} "${escaped}" always;`);
}
if (!directives.length) throw new Error("No global headers found in public/_headers");
await mkdir(new URL("../.next/", import.meta.url), { recursive: true });
await writeFile(new URL("../.next/nginx-headers.conf", import.meta.url), `${directives.join("\n")}\n`);
