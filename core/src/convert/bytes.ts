/** Small binary helpers shared by the hand-written encoders. */

let crcTable: Uint32Array | null = null;

export function crc32(data: Uint8Array, start = 0, end = data.length): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Growable little/big-endian byte writer. */
export class ByteWriter {
  private buf: Uint8Array;
  length = 0;

  constructor(size = 1024) {
    this.buf = new Uint8Array(size);
  }

  private ensure(n: number) {
    if (this.length + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.length + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.length));
    this.buf = next;
  }

  u8(v: number) {
    this.ensure(1);
    this.buf[this.length++] = v & 0xff;
  }
  u16le(v: number) {
    this.u8(v);
    this.u8(v >>> 8);
  }
  u32le(v: number) {
    this.u16le(v & 0xffff);
    this.u16le(v >>> 16);
  }
  u16be(v: number) {
    this.u8(v >>> 8);
    this.u8(v);
  }
  u32be(v: number) {
    this.u16be(v >>> 16);
    this.u16be(v & 0xffff);
  }
  bytes(b: ArrayLike<number>) {
    this.ensure(b.length);
    this.buf.set(b, this.length);
    this.length += b.length;
  }
  ascii(s: string) {
    for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i));
  }
  /** overwrite a u32 at an earlier position */
  setU32le(pos: number, v: number) {
    this.buf[pos] = v & 0xff;
    this.buf[pos + 1] = (v >>> 8) & 0xff;
    this.buf[pos + 2] = (v >>> 16) & 0xff;
    this.buf[pos + 3] = (v >>> 24) & 0xff;
  }
  result(): Uint8Array {
    return this.buf.slice(0, this.length);
  }
}

export const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));

export function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export async function blobBytes(b: Blob): Promise<Uint8Array> {
  return new Uint8Array(await b.arrayBuffer());
}
