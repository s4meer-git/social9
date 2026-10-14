// Records the explainer scenes as MP4 clips for social posts and ads.
// Usage: npm run dev (or serve the static build), then `node scripts/record-reel.mjs [baseUrl]`.
// Needs Google Chrome and ffmpeg on PATH.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const out = path.resolve("public/reel/video");
const tmp = path.resolve(".reel-tmp");
mkdirSync(out, { recursive: true });

const formats = { "16x9": [1280, 720], "9x16": [720, 1280], "1x1": [1080, 1080] };
const scenes = ["cutout", "faces", "resize", "pfp"];

const browser = await chromium.launch({ channel: "chrome" });
for (const [fmt, [w, h]] of Object.entries(formats)) {
  for (const scene of scenes) {
    rmSync(tmp, { recursive: true, force: true });
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: tmp, size: { width: w, height: h } } });
    const page = await ctx.newPage();
    await page.goto(`${base}/reel?scene=${scene}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(6800);
    await ctx.close();
    const webm = path.join(tmp, readdirSync(tmp)[0]);
    const mp4 = path.join(out, `${scene}-${fmt}.mp4`);
    // trim the blank first frames, encode H.264 for every platform
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "0.4", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", "-an", mp4]);
    console.log("wrote", path.relative(process.cwd(), mp4));
  }
}
rmSync(tmp, { recursive: true, force: true });
await browser.close();
