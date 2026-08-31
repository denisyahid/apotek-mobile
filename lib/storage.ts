/**
 * Wrapper LocalStorage yang aman (anti error di SSR, JSON-safe, broadcast event).
 * Seluruh akses LocalStorage HARUS melalui modul ini agar mudah diganti
 * dengan backend database (Supabase) di kemudian hari.
 */
export const isBrowser = () => typeof window !== "undefined";

export const StorageKeys = {
  session: "apotek:currentUser",
  cart: "apotek:cart",
  orders: "apotek:orders",
  payments: "apotek:payments",
  paymentProofs: "apotek:paymentProofs",
  consultations: "apotek:consultations",
  chatMessages: "apotek:chatMessages",
  notifications: "apotek:notifications",
  users: "apotek:users",
  productOverrides: "apotek:productOverrides",
  categoryOverrides: "apotek:categoryOverrides",
  shipping: "apotek:shipping",
  seeded: "apotek:seeded",
} as const;

/** event custom yang dipancarkan setiap kali data berubah */
export const DATA_CHANGED_EVENT = "apotek:data-changed";

export interface DataChangedDetail {
  key: string;
}

export function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent<DataChangedDetail>(DATA_CHANGED_EVENT, { detail: { key } })
    );
  } catch (error) {
    // LocalStorage penuh (umumnya karena gambar base64) — beri pesan jelas.
    console.warn(
      "[storage] Gagal menyimpan data (kemungkinan kuota LocalStorage penuh):",
      error
    );
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent<DataChangedDetail>(DATA_CHANGED_EVENT, { detail: { key } })
    );
  } catch {
    /* ignore */
  }
}

/** hapus seluruh data prototype (dipakai fitur "Reset Data" di admin) */
export function clearPrototypeData(): void {
  if (!isBrowser()) return;
  try {
    Object.values(StorageKeys).forEach((k) => k !== StorageKeys.session && window.localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key: "*" } }));
  } catch {
    /* ignore */
  }
}
