import { describe, expect, it } from "vitest";
import { crc32, ascii } from "./bytes";
import { padTo, type FormatId } from "./encoders";
import { defaultSpec, targetSize } from "./pipeline";
import { zip } from "./zip";

/** Smallest plausible files for each format, enough for the padding code to work with. */
const fake: Record<FormatId, Uint8Array> = {
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, ...ascii("JFIF\0"), 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]),
  png: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, ...ascii("IHDR"), 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89, 0, 0, 0, 0, ...ascii("IEND"), 0xae, 0x42, 0x60, 0x82]),
  webp: (() => {
    const b = new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP"), ...ascii("VP8 "), 2, 0, 0, 0, 0, 0]);
    const size = b.length - 8;
    b[4] = size;
    return b;
  })(),
  avif: new Uint8Array([0, 0, 0, 16, ...ascii("ftypavif"), 0, 0, 0, 0]),
  gif: new Uint8Array([...ascii("GIF89a"), 1, 0, 1, 0, 0, 0, 0, 0x3b]),
  bmp: new Uint8Array(60),
  tiff: new Uint8Array([...ascii("II"), 42, 0, 8, 0, 0, 0]),
  ico: new Uint8Array([0, 0, 1, 0, 0, 0]),
  pdf: ascii("%PDF-1.4\n%%EOF\n"),
  svg: ascii('<svg xmlns="http://www.w3.org/2000/svg"/>'),
};

describe("padTo", () => {
  const formats = Object.keys(fake) as FormatId[];
  for (const f of formats) {
    it(`grows ${f} to exactly the target`, () => {
      for (const target of [fake[f].length + 40, 51200, 70000, 204801 + (f === "webp" ? 1 : 0)]) {
        const out = padTo(fake[f], f, target);
        expect(out, `${f} → ${target}`).not.toBeNull();
        expect(out!.length).toBe(target);
      }
    });
  }

  it("keeps a JPEG starting with SOI and ending with EOI", () => {
    const out = padTo(fake.jpeg, "jpeg", 70000)!;
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]);
    expect([out[out.length - 2], out[out.length - 1]]).toEqual([0xff, 0xd9]);
    // first segment after SOI is a comment (FFFE) with a valid length
    expect([out[2], out[3]]).toEqual([0xff, 0xfe]);
    expect((out[4] << 8) | out[5]).toBeLessThanOrEqual(65535);
  });

  it("updates the RIFF size of a padded WebP", () => {
    const out = padTo(fake.webp, "webp", 51200)!;
    const riff = out[4] | (out[5] << 8) | (out[6] << 16) | (out[7] << 24);
    expect(riff).toBe(out.length - 8);
  });

  it("keeps the GIF trailer last", () => {
    const out = padTo(fake.gif, "gif", 5000)!;
    expect(out[out.length - 1]).toBe(0x3b);
  });

  it("refuses to shrink", () => {
    expect(padTo(fake.png, "png", 3)).toBeNull();
  });
});

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(ascii("123456789"))).toBe(0xcbf43926);
  });
});

describe("zip", () => {
  it("writes local headers, a central directory and unique names", () => {
    const out = zip([
      { name: "a.jpg", bytes: ascii("hello") },
      { name: "a.jpg", bytes: ascii("world") },
    ]);
    const view = new DataView(out.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = out.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const text = new TextDecoder().decode(out);
    expect(text).toContain("a.jpg");
    expect(text).toContain("a-2.jpg");
  });
});

describe("targetSize", () => {
  it("keeps the photo's shape when the lock is on", () => {
    expect(targetSize(4000, 3000, { ...defaultSpec, dims: "exact", width: 1200, lock: true })).toEqual({ w: 1200, h: 900 });
  });
  it("uses the exact box when the lock is off", () => {
    expect(targetSize(4000, 3000, { ...defaultSpec, dims: "exact", width: 600, height: 600, lock: false })).toEqual({ w: 600, h: 600 });
  });
  it("turns print size into pixels at the DPI", () => {
    // 3.5 × 4.5 cm at 200 DPI
    expect(targetSize(4000, 3000, { ...defaultSpec, dims: "print", printW: 3.5, printH: 4.5, unit: "cm", dpi: 200 })).toEqual({ w: 276, h: 354 });
    expect(targetSize(4000, 3000, { ...defaultSpec, dims: "print", printW: 2, printH: 2, unit: "in", dpi: 300 })).toEqual({ w: 600, h: 600 });
  });
  it("never enlarges in longest-side mode", () => {
    expect(targetSize(800, 600, { ...defaultSpec, dims: "longest", width: 1600 })).toEqual({ w: 800, h: 600 });
    expect(targetSize(4000, 2000, { ...defaultSpec, dims: "longest", width: 1600 })).toEqual({ w: 1600, h: 800 });
  });
  it("scales by percent", () => {
    expect(targetSize(1000, 500, { ...defaultSpec, dims: "percent", percent: 25 })).toEqual({ w: 250, h: 125 });
  });
});
