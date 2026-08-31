import type {
  AppNotification,
  Address,
  CartItem,
  Category,
  ChatMessage,
  Consultation,
  FulfillmentMethod,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentProof,
  Product,
  ProductFilters,
  Role,
  Session,
  ShippingConfig,
  StoredUser,
  User,
} from "@/types";

/**
 * Kontrak repository — lapisan abstraksi data.
 * Implementasi prototype: Json*Repository (baca seed) & Local*Repository (LocalStorage).
 * Implementasi production: Supabase*Repository — UI & service TIDAK berubah.
 */

export interface ProductRepository {
  getAll(filters?: ProductFilters): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  search(query: string, filters?: Omit<ProductFilters, "query">): Promise<Product[]>;
  /** admin: tambah/ubah produk */
  save(product: Product): Promise<Product>;
  /** admin: hapus produk */
  remove(id: string): Promise<void>;
  /** kurangi/tambah stok (mis. saat order dibuat/dibatalkan) */
  adjustStock(id: string, delta: number): Promise<void>;
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  getBySlug(slug: string): Promise<Category | null>;
  save(category: Category): Promise<Category>;
  remove(id: string): Promise<void>;
}

export interface CartRepository {
  getItems(): Promise<CartItem[]>;
  setItems(items: CartItem[]): Promise<void>;
  clear(): Promise<void>;
}

export interface OrderRepository {
  getAll(): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
  remove(id: string): Promise<void>;
  countAll(): Promise<number>;
}

export interface PaymentRepository {
  getAll(): Promise<Payment[]>;
  getByOrder(orderId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<Payment>;
}

/**
 * Penyimpanan bukti pembayaran — sengaja dipisah agar mudah diganti:
 * LocalPaymentProofRepository (base64 LocalStorage)
 *   → SupabasePaymentProofRepository (Supabase Storage + URL publik)
 */
export interface PaymentProofRepository {
  upload(input: {
    orderId: string;
    uploadedBy: string;
    dataUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
  }): Promise<PaymentProof>;
  getByOrder(orderId: string): Promise<PaymentProof | null>;
  getById(id: string): Promise<PaymentProof | null>;
}

export interface ChatRepository {
  getConsultations(): Promise<Consultation[]>;
  getConsultation(id: string): Promise<Consultation | null>;
  saveConsultation(consultation: Consultation): Promise<Consultation>;
  getMessages(consultationId: string): Promise<ChatMessage[]>;
  addMessage(message: ChatMessage): Promise<ChatMessage>;
}

export interface UserRepository {
  getAll(): Promise<StoredUser[]>;
  getById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<StoredUser | null>;
  save(user: StoredUser): Promise<StoredUser>;
  getSession(): Promise<Session | null>;
  setSession(session: Session | null): Promise<void>;
}

export interface NotificationRepository {
  getAll(audience: Role): Promise<AppNotification[]>;
  save(notification: AppNotification): Promise<AppNotification>;
  markRead(ids: string[]): Promise<void>;
  markAllRead(audience: Role): Promise<void>;
}

export interface PaymentMethodRepository {
  getAll(): Promise<PaymentMethod[]>;
  getById(id: string): Promise<PaymentMethod | null>;
}

export interface ShippingRepository {
  getConfig(): Promise<ShippingConfig>;
  saveConfig(config: ShippingConfig): Promise<ShippingConfig>;
  /**
   * Prototype: ongkir tetap dari config admin.
   * Production: hitung dari API ekspedisi berdasarkan alamat.
   */
  estimate(method: FulfillmentMethod, address?: Address, subtotal?: number): Promise<number>;
}

export interface Repositories {
  products: ProductRepository;
  categories: CategoryRepository;
  cart: CartRepository;
  orders: OrderRepository;
  payments: PaymentRepository;
  paymentProofs: PaymentProofRepository;
  chat: ChatRepository;
  users: UserRepository;
  notifications: NotificationRepository;
  paymentMethods: PaymentMethodRepository;
  shipping: ShippingRepository;
}

export type { OrderStatus };
