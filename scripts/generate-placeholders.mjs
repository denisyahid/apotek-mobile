/**
 * Generator placeholder untuk aset yang belum berupa foto:
 * - QRIS demo (pola QR deterministik, bukan QR scannable)
 * - Bukti pembayaran demo (untuk seed data)
 * Placeholder herbal-box & mask-box ditulis langsung sebagai file SVG statis.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const out = (p, s) => writeFileSync(p, s);

mkdirSync("public/images/qr", { recursive: true });

// ---------- QR demo: grid 25x25 deterministik dengan 3 finder pattern ----------
const N = 25;
const cells = Array.from({ length: N }, () => Array(N).fill(0));
let seed = 20260831;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const finder = (r0, c0) => {
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++) {
      const edge = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      cells[r0 + r][c0 + c] = edge || core ? 1 : 0;
    }
};
const inFinder = (r, c) =>
  (r < 8 && c < 8) || (r < 8 && c > N - 9) || (r > N - 9 && c < 8);
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++) if (!inFinder(r, c)) cells[r][c] = rand() > 0.52 ? 1 : 0;
finder(0, 0);
finder(0, N - 7);
finder(N - 7, 0);

let rects = "";
const s = 10; // ukuran sel
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++)
    if (cells[r][c])
      rects += `<rect x="${c * s}" y="${r * s}" width="${s}" height="${s}"/>`;

out(
  "public/images/qr/qris-demo.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">\n<rect width="250" height="250" fill="#ffffff"/>\n<g fill="#134e4a">${rects}</g>\n</svg>\n`
);

// ---------- Bukti pembayaran demo (seed untuk admin) ----------
out(
  "public/images/demo-proof.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400" width="320" height="400">
  <rect width="320" height="400" rx="16" fill="#f8fafc"/>
  <rect x="24" y="24" width="272" height="352" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="48" y="52" width="120" height="16" rx="8" fill="#cbd5e1"/>
  <rect x="48" y="84" width="224" height="10" rx="5" fill="#e2e8f0"/>
  <rect x="48" y="104" width="180" height="10" rx="5" fill="#e2e8f0"/>
  <rect x="48" y="140" width="224" height="90" rx="8" fill="#f1f5f9"/>
  <text x="160" y="192" font-family="Roboto, Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Bukti Transfer (Demo)</text>
  <rect x="48" y="252" width="224" height="10" rx="5" fill="#e2e8f0"/>
  <rect x="48" y="276" width="160" height="10" rx="5" fill="#e2e8f0"/>
  <rect x="48" y="316" width="90" height="24" rx="12" fill="#d7f7f0"/>
</svg>\n`
);

console.log("✓ Placeholder generated: qris-demo.svg, demo-proof.svg");
