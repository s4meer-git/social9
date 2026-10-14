import { ByteWriter, crc32 } from "./bytes";

/** Minimal ZIP writer (stored, no compression: images are already compressed). */
export function zip(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const out = new ByteWriter(files.reduce((n, f) => n + f.bytes.length + 100, 100));
  const central: { name: Uint8Array; crc: number; size: number; offset: number }[] = [];
  const enc = new TextEncoder();
  const used = new Set<string>();
  for (const f of files) {
    // keep names unique: photo.jpg, photo-2.jpg …
    let name = f.name;
    for (let i = 2; used.has(name); i++) name = f.name.replace(/(\.[^.]+)?$/, `-${i}$1`);
    used.add(name);
    const nameBytes = enc.encode(name);
    const crc = crc32(f.bytes);
    const offset = out.length;
    out.u32le(0x04034b50);
    out.u16le(20);
    out.u16le(0x0800); // UTF-8 names
    out.u16le(0);
    out.u16le(0);
    out.u16le(0);
    out.u32le(crc);
    out.u32le(f.bytes.length);
    out.u32le(f.bytes.length);
    out.u16le(nameBytes.length);
    out.u16le(0);
    out.bytes(nameBytes);
    out.bytes(f.bytes);
    central.push({ name: nameBytes, crc, size: f.bytes.length, offset });
  }
  const cdStart = out.length;
  for (const c of central) {
    out.u32le(0x02014b50);
    out.u16le(20);
    out.u16le(20);
    out.u16le(0x0800);
    out.u16le(0);
    out.u16le(0);
    out.u16le(0);
    out.u32le(c.crc);
    out.u32le(c.size);
    out.u32le(c.size);
    out.u16le(c.name.length);
    out.u16le(0);
    out.u16le(0);
    out.u16le(0);
    out.u16le(0);
    out.u32le(0);
    out.u32le(c.offset);
    out.bytes(c.name);
  }
  const cdSize = out.length - cdStart;
  out.u32le(0x06054b50);
  out.u16le(0);
  out.u16le(0);
  out.u16le(central.length);
  out.u16le(central.length);
  out.u32le(cdSize);
  out.u32le(cdStart);
  out.u16le(0);
  return out.result();
}
