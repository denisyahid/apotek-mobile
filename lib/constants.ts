import type { OrderStatus, PaymentStatus } from "@/types";

export const APP_NAME = "Apotek Sehatku";
export const APP_TAGLINE = "Apotek online terpercaya untuk keluarga Anda";
export const APP_DESCRIPTION =
  "Pesan obat, vitamin, dan kebutuhan kesehatan dengan mudah. Konsultasi gratis dengan apoteker, pilih ambil di tempat atau dikirim ke alamat Anda.";

/** Disclaimer keamanan konsultasi — tidak boleh dihilangkan */
export const MEDICAL_DISCLAIMER =
  "Informasi dalam aplikasi ini bukan pengganti diagnosis atau pemeriksaan tenaga kesehatan.";

export type Tone = "amber" | "sky" | "violet" | "teal" | "green" | "red" | "slate";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: Tone; description: string }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    tone: "amber",
    description: "Selesaikan pembayaran lalu unggah bukti pembayaran.",
  },
  waiting_confirmation: {
    label: "Menunggu Konfirmasi",
    tone: "sky",
    description: "Bukti pembayaran diterima, menunggu verifikasi apoteker.",
  },
  payment_confirmed: {
    label: "Pembayaran Dikonfirmasi",
    tone: "teal",
    description: "Pembayaran Anda sudah diverifikasi.",
  },
  processing: {
    label: "Pesanan Diproses",
    tone: "violet",
    description: "Pesanan Anda sedang disiapkan oleh apoteker.",
  },
  ready_to_pickup: {
    label: "Siap Diambil",
    tone: "teal",
    description: "Pesanan sudah siap, silakan ambil di apotek.",
  },
  shipping: {
    label: "Sedang Dikirim",
    tone: "teal",
    description: "Pesanan Anda sedang dalam pengiriman.",
  },
  completed: {
    label: "Selesai",
    tone: "green",
    description: "Pesanan telah selesai. Terima kasih telah berbelanja.",
  },
  cancelled: {
    label: "Dibatalkan",
    tone: "red",
    description: "Pesanan dibatalkan.",
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: Tone }
> = {
  awaiting_proof: { label: "Belum Ada Bukti", tone: "slate" },
  waiting_confirmation: { label: "Menunggu Konfirmasi", tone: "sky" },
  confirmed: { label: "Pembayaran Terkonfirmasi", tone: "green" },
  rejected: { label: "Pembayaran Ditolak", tone: "red" },
};

/** Filter tab riwayat pesanan pasien */
export const ORDER_FILTERS = [
  { id: "all", label: "Semua", statuses: null },
  { id: "unpaid", label: "Belum Dibayar", statuses: ["pending_payment"] as OrderStatus[] },
  {
    id: "process",
    label: "Diproses",
    statuses: [
      "waiting_confirmation",
      "payment_confirmed",
      "processing",
      "ready_to_pickup",
      "shipping",
    ] as OrderStatus[],
  },
  { id: "done", label: "Selesai", statuses: ["completed"] as OrderStatus[] },
  { id: "cancelled", label: "Dibatalkan", statuses: ["cancelled"] as OrderStatus[] },
] as const;

export type OrderFilterId = (typeof ORDER_FILTERS)[number]["id"];

export const PROVINCES = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Banten",
  "DI Yogyakarta",
  "Bali",
  "Sumatera Utara",
  "Sumatera Selatan",
  "Kalimantan Timur",
  "Kalimantan Selatan",
  "Sulawesi Selatan",
  "Lainnya",
];

/** daftar gambar produk yang tersedia untuk form admin (tanpa upload) */
export const PRESET_PRODUCT_IMAGES = [
  "/images/products/tablet-strip.jpg",
  "/images/products/tablet-capsule.jpg",
  "/images/products/syrup-orange.jpg",
  "/images/products/syrup-brown.jpg",
  "/images/products/vitamin-c.jpg",
  "/images/products/supplement-jar.jpg",
  "/images/products/cream-tube.jpg",
  "/images/products/drops-bottle.jpg",
  "/images/products/device-box.jpg",
  "/images/products/herbal-box.svg",
  "/images/products/mask-box.svg",
];
