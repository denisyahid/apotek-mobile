/**
 * Tipe data domain aplikasi Apotek Sehatku.
 * Semua layer (UI, service, repository) bergantung pada tipe ini —
 * saat migrasi ke Supabase, cukup ganti implementasi repository.
 */

// ---------- Pengguna & Autentikasi ----------
export type Role = "patient" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

/**
 * HANYA PROTOTYPE: password disimpan sebagai hash sederhana di JSON/LocalStorage.
 * Production: autentikasi harus melalui backend (mis. Supabase Auth) —
 * jangan pernah menyimpan kredensial di sisi klien.
 */
export interface StoredUser extends User {
  passwordHash: string;
}

export interface Session {
  userId: string;
  role: Role;
  name: string;
  email: string;
  loggedAt: string;
}

// ---------- Katalog ----------
export interface Category {
  id: string;
  name: string;
  slug: string;
  /** nama ikon lucide — dipetakan di komponen CategoryIcon */
  icon: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  categoryId: string;
  price: number;
  stock: number;
  unit?: string;
  image: string;
  description: string;
  /** aturan penggunaan */
  usage?: string;
  additionalInfo?: string;
  rating: number;
  sold: number;
  isActive: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  /** obat keras — wajib resep dokter & verifikasi apoteker */
  requiresPrescription?: boolean;
  createdAt: string;
}

export type ProductSort = "popular" | "price_asc" | "price_desc" | "newest" | "rating";

export interface ProductFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
  includeInactive?: boolean;
  limit?: number;
}

// ---------- Keranjang ----------
export interface CartItem {
  productId: string;
  qty: number;
  addedAt: string;
}

// ---------- Pesanan ----------
export type FulfillmentMethod = "pickup" | "delivery";

export interface Address {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
  note?: string;
}

export type OrderStatus =
  | "pending_payment"
  | "waiting_confirmation"
  | "payment_confirmed"
  | "processing"
  | "ready_to_pickup"
  | "shipping"
  | "completed"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  requiresPrescription?: boolean;
}

export interface OrderEvent {
  status: OrderStatus | "created";
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  items: OrderItem[];
  fulfillment: FulfillmentMethod;
  address?: Address;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  /** alasan penolakan pembayaran terakhir (terlihat oleh pasien) */
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  history: OrderEvent[];
}

// ---------- Pembayaran ----------
export type PaymentStatus = "awaiting_proof" | "waiting_confirmation" | "confirmed" | "rejected";
export type PaymentMethodType = "bank_transfer" | "qris";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  qrImage?: string;
  instructions?: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  orderId: string;
  methodId: string;
  methodName: string;
  amount: number;
  status: PaymentStatus;
  proofId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata bukti pembayaran.
 * Prototype: `dataUrl` berisi gambar base64 di LocalStorage (simulasi).
 * Production: unggah ke Supabase Storage lalu simpan `url` publik.
 */
export interface PaymentProof {
  id: string;
  orderId: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  url?: string;
  uploadedAt: string;
  uploadedBy: string;
}

// ---------- Konsultasi / Chat ----------
export type ConsultationStatus = "open" | "closed";

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  subject: string;
  status: ConsultationStatus;
  createdAt: string;
  lastMessageAt: string;
  /** jumlah pesan belum dibaca pasien */
  patientUnread: number;
  /** jumlah pesan belum dibaca admin */
  adminUnread: number;
}

export type ChatMessageType = "text" | "image" | "product" | "system";
export type ChatSender = Role | "system";

export interface ChatMessage {
  id: string;
  consultationId: string;
  sender: ChatSender;
  senderName: string;
  type: ChatMessageType;
  text?: string;
  /** prototype: gambar base64 lokal — production: Supabase Storage URL */
  imageDataUrl?: string;
  product?: RecommendedProduct;
  createdAt: string;
}

/** snapshot produk yang direkomendasikan admin melalui chat */
export interface RecommendedProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  categoryId?: string;
  requiresPrescription?: boolean;
}

// ---------- Notifikasi ----------
export type NotificationType = "order" | "payment" | "chat" | "recommendation" | "system";
export type NotificationAudience = "patient" | "admin";

export interface AppNotification {
  id: string;
  audience: NotificationAudience;
  /** null/undefined berarti untuk semua pasien pada perangkat ini */
  patientId?: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ---------- Pengiriman ----------
export interface ShippingConfig {
  shippingCost: number;
  pickup: {
    name: string;
    address: string;
    city: string;
    phone: string;
    hours: string;
  };
  note?: string;
}
