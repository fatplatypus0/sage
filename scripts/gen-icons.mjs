/**
 * Generates the PWA/app icons from the same "sparkle over a planet limb" mark used in the UI.
 * Pure Node (zlib only, no image deps) — run `npm run icons` after changing the mark.
 *
 *   public/icons/icon-192.png        manifest
 *   public/icons/icon-512.png        manifest + og:image
 *   public/icons/icon-maskable-512.png  adaptive/maskable
 *   public/icons/apple-touch-icon.png   iOS (opaque, iOS applies its own mask)
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** signed distance to a rounded box (negative = inside) */
function sdRoundBox(px, py, hx, hy, r) {
  const qx = Math.abs(px) - hx + r;
  const qy = Math.abs(py) - hy + r;
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** astroid (4-point concave star) — the SAGE sparkle. Approximate distance is fine for AA. */
function astroidField(px, py, a, b) {
  const dx = Math.abs(px) / a;
  const dy = Math.abs(py) / b;
  return Math.pow(dx, 2 / 3) + Math.pow(dy, 2 / 3); // <=1 inside
}

function render({ size, radius, opaque, starScale, limb }) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const A = size * 0.26 * starScale;
  const B = size * 0.28 * starScale;
  const starCY = cy + size * 0.03;
  // the limb: a huge ellipse whose crest crosses the upper third
  const limbCX = cx;
  const limbCY = size * (limb.crestY + limb.rxY);
  const limbRX = size * limb.rxX;
  const limbRY = size * limb.rxY;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const sd = sdRoundBox(px, py, cx - 0.5, cy - 0.5, radius);
      const cover = opaque ? 1 : smooth(0.5, -0.5, sd);
      if (cover <= 0) {
        const i = (y * size + x) * 4;
        buf[i + 3] = 0;
        continue;
      }

      // background: vertical void gradient, slightly lifted at the top centre
      const t = y / size;
      const lift = Math.max(0, 1 - Math.hypot((x - cx) / (size * 0.6), (y - size * 0.1) / (size * 0.5))) * 0.5;
      let r = 4 + 22 * t + 40 * lift;
      let g = 9 + 32 * t + 58 * lift;
      let b = 30 + 58 * t + 110 * lift;

      // the limb glow
      const lf = Math.pow((x - limbCX) / limbRX, 2) + Math.pow((y - limbCY) / limbRY, 2);
      const limbDist = (Math.sqrt(lf) - 1) * limbRY;
      const rim = smooth(3.2, 0, Math.abs(limbDist));
      const halo = Math.exp(-Math.pow(Math.abs(limbDist) / (size * 0.055), 2)) * 0.55;
      const limbA = Math.max(rim * 0.95, halo * 0.8) * (y < limbCY ? 1 : 0.35);
      r += (200 - r) * limbA * 0.85 + limbA * 24;
      g += (222 - g) * limbA * 0.85 + limbA * 30;
      b += (255 - b) * limbA * 0.9 + limbA * 40;

      // the sparkle
      const af = astroidField(x - cx, y - starCY, A, B);
      const inside = af <= 1 ? 1 : smooth(1.06, 1.0, af);
      const glow = Math.exp(-Math.pow(Math.max(0, af - 1) * A * 0.55, 2) / 90) * 0.5;
      if (glow > 0.02 && inside < 1) {
        r += (150 - r) * glow;
        g += (185 - g) * glow;
        b += (255 - b) * glow;
      }
      if (inside > 0) {
        const st = clamp((y - (starCY - B)) / (2 * B));
        const sr = 255 - 82 * st;
        const sg = 255 - 86 * st;
        const sb = 255 - 42 * st;
        r = r + (sr - r) * inside;
        g = g + (sg - g) * inside;
        b = b + (sb - b) * inside;
      }

      const i = (y * size + x) * 4;
      buf[i] = Math.min(255, Math.round(r));
      buf[i + 1] = Math.min(255, Math.round(g));
      buf[i + 2] = Math.min(255, Math.round(b));
      buf[i + 3] = Math.round(255 * cover);
    }
  }
  return buf;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const limb = { crestY: 0.34, rxX: 0.92, rxY: 0.78 };
const jobs = [
  ['icon-512.png', { size: 512, radius: 112, opaque: false, starScale: 1, limb }],
  ['icon-192.png', { size: 192, radius: 42, opaque: false, starScale: 1, limb }],
  ['icon-maskable-512.png', { size: 512, radius: 0, opaque: true, starScale: 0.66, limb: { crestY: 0.4, rxX: 1.15, rxY: 0.9 } }],
  ['apple-touch-icon.png', { size: 180, radius: 0, opaque: true, starScale: 0.9, limb }],
];

for (const [name, opts] of jobs) {
  const out = png(opts.size, opts.size, render(opts));
  writeFileSync(join(OUT, name), out);
  console.log(`${name}: ${opts.size}x${opts.size} · ${(out.length / 1024).toFixed(1)} kB`);
}
