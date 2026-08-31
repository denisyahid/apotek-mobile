import type { Role, Session } from "@/types";

/**
 * Abstraksi otorisasi berbasis role & permission.
 * Prototype: dievaluasi di klien. Production: PINDAHKAN evaluasi ini ke
 * backend (mis. Supabase RLS / edge function) — UI hanya menyembunyikan
 * elemen, server tetap wajib memvalidasi.
 */
export type Permission =
  | "admin.access"
  | "admin.products.read"
  | "admin.products.write"
  | "admin.orders.read"
  | "admin.orders.write"
  | "admin.chat.read"
  | "admin.chat.write"
  | "admin.settings.write"
  | "patient.order.create"
  | "patient.order.cancel"
  | "patient.chat.create";

const ROLE_PERMISSIONS: Record<Role, Permission[] | "*"> = {
  admin: "*",
  patient: [
    "patient.order.create",
    "patient.order.cancel",
    "patient.chat.create",
  ],
};

export function can(session: Session | null, permission: Permission): boolean {
  if (!session) return false;
  const allowed = ROLE_PERMISSIONS[session.role];
  if (allowed === "*") return true;
  return allowed.includes(permission);
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === "admin";
}

/**
 * HANYA PROTOTYPE — hash "obfuscation" sederhana agar password asli tidak
 * tersimpan mentah di LocalStorage. BUKAN keamanan cryptografik.
 * Production: gunakan Supabase Auth (bcrypt/argon2 di server).
 */
export function demoHashPassword(password: string): string {
  const salted = `demo:${password}`;
  if (typeof window === "undefined") {
    return Buffer.from(salted).toString("base64");
  }
  return window.btoa(salted);
}

export function demoVerifyPassword(password: string, hash: string): boolean {
  return demoHashPassword(password) === hash;
}

/** Error standar untuk pelanggaran otorisasi (dilempar dari service layer) */
export class PermissionError extends Error {
  constructor(message = "Anda tidak memiliki izin untuk aksi ini.") {
    super(message);
    this.name = "PermissionError";
  }
}
