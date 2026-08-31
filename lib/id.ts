/** Generator ID unik sisi klien (prototype). Production: dibuat database. */

let counter = 0;

function randomBlock(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, "0");
}

export function generateId(prefix: string): string {
  counter = (counter + 1) % 10000;
  return `${prefix}-${Date.now().toString(36)}${counter.toString().padStart(4, "0")}${randomBlock()}`.toUpperCase();
}

/** Nomor pesanan: ORD-YYYYMMDD-XXXX */
export function generateOrderNumber(existingCount: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(existingCount + 1).padStart(4, "0");
  return `ORD-${y}${m}${d}-${seq}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
