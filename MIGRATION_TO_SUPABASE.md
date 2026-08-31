# 🔄 MIGRATION_TO_SUPABASE.md

Panduan memindahkan **Apotek Sehatku** dari prototype (JSON + LocalStorage) ke **Supabase (PostgreSQL + Auth + Storage + Realtime)** tanpa menulis ulang frontend.

> Prinsip arsitektur: UI → **services** → **repositories** → sumber data.
> Komponen UI **tidak tahu** dari mana data berasal — hanya interface `repositories/types.ts`. Migrasi = menulis implementasi baru + menukar container.

---

## 0. Peta Migrasi

| Prototype | Production (Supabase) | Yang berubah |
|---|---|---|
| `data/*.json` (read-only seed) | Tabel PostgreSQL | `Json*Repository` → `SupabaseProductRepository` dll. |
| LocalStorage (`apotek:*`) | Baris tabel PostgreSQL | `Local*Repository` → `Supabase*Repository` |
| Bukti pembayaran base64 LocalStorage | Supabase **Storage** bucket `payment-proofs` | `LocalPaymentProofRepository` → `SupabasePaymentProofRepository` |
| Chat LocalStorage + CustomEvent | Tabel `messages` + **Realtime** | polling/event lokal → `postgres_changes` subscription |
| Auth demo (hash LocalStorage) | **Supabase Auth** (email/password + JWT) | `authService` internal saja |
| Otorisasi `can()` di klien | **RLS** (Row Level Security) di server | UI tetap memakai `can()` untuk UX |
| Ongkir manual admin | API ekspedisi / edge function | `ShippingRepository.estimate()` |
| Notification LocalStorage | Tabel `notifications` + Realtime | idem pola chat |

---

## 1. Skema Database (contoh)

```sql
-- profiles (1-1 dengan auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role text not null default 'patient' check (role in ('patient','admin')),
  created_at timestamptz not null default now()
);

create table categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text not null default 'pill',
  description text
);

create table products (
  id text primary key,
  name text not null,
  brand text,
  category_id text references categories(id),
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  unit text,
  image text not null,
  description text not null,
  usage text,
  additional_info text,
  rating numeric(2,1) not null default 0,
  sold integer not null default 0,
  is_active boolean not null default true,
  is_popular boolean default false,
  is_new boolean default false,
  requires_prescription boolean default false,
  created_at timestamptz not null default now()
);

create table carts (
  user_id uuid references profiles(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  qty integer not null check (qty > 0),
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create type order_status as enum ('pending_payment','waiting_confirmation',
  'payment_confirmed','processing','ready_to_pickup','shipping','completed','cancelled');

create table orders (
  id text primary key,                       -- ORD-YYYYMMDD-XXXX (buat di klien atau fungsi DB)
  patient_id uuid references profiles(id),
  patient_name text not null,
  patient_phone text not null,
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  address jsonb,
  subtotal integer not null,
  shipping_cost integer not null default 0,
  total integer not null,
  status order_status not null default 'pending_payment',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  order_id text references orders(id) on delete cascade,
  product_id text,
  name text not null,                        -- snapshot saat transaksi
  image text not null,
  price integer not null,
  qty integer not null,
  requires_prescription boolean default false,
  primary key (order_id, product_id)
);

create table order_events (
  id bigserial primary key,
  order_id text references orders(id) on delete cascade,
  status order_status not null,
  note text,
  at timestamptz not null default now()
);

create type payment_status as enum ('awaiting_proof','waiting_confirmation','confirmed','rejected');

create table payments (
  id text primary key,
  order_id text unique references orders(id) on delete cascade,
  method_id text not null,
  method_name text not null,
  amount integer not null,
  status payment_status not null default 'awaiting_proof',
  proof_id text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_proofs (
  id text primary key,
  order_id text references orders(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  size integer not null,
  url text not null,                         -- URL publik Supabase Storage
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create table payment_methods (
  id text primary key,
  type text not null check (type in ('bank_transfer','qris')),
  name text not null,
  bank_name text, account_number text, account_name text, qr_image text,
  instructions text,
  is_active boolean not null default true
);

create table shipping_configs (
  id text primary key default 'singleton',
  shipping_cost integer not null default 15000,
  pickup jsonb not null,
  note text
);

create table consultations (
  id text primary key,
  patient_id uuid references profiles(id),
  patient_name text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  patient_unread integer not null default 0,
  admin_unread integer not null default 0
);

create table messages (
  id bigserial primary key,
  consultation_id text references consultations(id) on delete cascade,
  sender text not null check (sender in ('patient','admin','system')),
  sender_name text not null,
  type text not null check (type in ('text','image','product','system')),
  text text,
  image_url text,                            -- Supabase Storage untuk gambar chat
  product jsonb,                             -- snapshot RecommendedProduct
  created_at timestamptz not null default now()
);

create table notifications (
  id bigserial primary key,
  audience text not null check (audience in ('patient','admin')),
  patient_id uuid references profiles(id),
  title text not null,
  body text not null,
  type text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
```

Seed awal: impor `data/*.json` lewat **Supabase Dashboard → Table Editor → Import CSV/JSON**, atau tulis skrip seed sekali jalan.

## 2. Row Level Security (otorisasi server)

```sql
alter table orders enable row level security;

-- pasien hanya melihat pesanannya sendiri; admin melihat semua
create policy "orders_select" on orders for select
  using (
    patient_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- hanya admin yang boleh mengubah status/konfirmasi
create policy "orders_admin_update" on orders for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- pasien membuat pesanannya sendiri
create policy "orders_insert_own" on orders for insert
  with check (patient_id = auth.uid());
-- (lanjutkan pola serupa untuk tabel lain)
```

> Abstraksi `can(session, permission)` di `lib/auth.ts` **tetap dipakai UI** untuk menyembunyikan elemen — namun keputusan final ada di RLS, sesuai catatan pada file tersebut.

## 3. Implementasi Repository (tanpa mengubah UI)

```ts
// repositories/supabase/product.ts
import { createClient } from "@supabase/supabase-js";
import type { ProductRepository } from "@/repositories/types";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export class SupabaseProductRepository implements ProductRepository {
  async getAll(filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase.from("products").select("*").eq("is_active", !filters.includeInactive);
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.inStockOnly) query = query.gt("stock", 0);
    // ... min/max price, sort, limit — atau pertahankan filterProducts() di memori
    const { data, error } = await query;
    if (error) throw new Error("Gagal memuat produk."); // pesan ramah pengguna
    return (data ?? []).map(toProduct);
  }
  async getById(id: string) { /* … */ }
  async search(query: string, filters = {}) { return this.getAll({ ...filters, query }); }
  async save(p: Product) { /* upsert */ }
  async remove(id: string) { /* delete */ }
  async adjustStock(id: string, delta: number) {
    // Production: gunakan RPC atomic agar bebas race condition
    // create function adjust_stock(pid text, d int) … update products set stock = greatest(0, stock + d) …
    await supabase.rpc("adjust_stock", { pid: id, d: delta });
  }
}
```

Selanjutnya tukar container:

```ts
// repositories/index.ts
export function getRepositories(): Repositories {
  return supabaseRepositories; // ganti dari Local*Repository
}
```

Selesai — **seluruh UI dan service tidak berubah** karena keduanya hanya bergantung pada interface `Repositories`.

## 4. Auth: LocalStorage → Supabase Auth

```ts
// services/authService.ts (bagian dalam saja yang berubah)
async signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Email atau kata sandi salah.");
  return toSession(data.user); // sesi disimpan Supabase (cookie), BUKAN LocalStorage
}
```

- Hapus `StoredUser.passwordHash` dan `LocalUserRepository`.
- Role admin dikelola di tabel `profiles` + klaim JWT (custom claim / fungsi `is_admin()`).
- Halaman admin tetap di-guard `AdminShell` + RLS.

## 5. Bukti Pembayaran: base64 → Supabase Storage

Interface sudah disiapkan (`PaymentProofRepository`):

```ts
// repositories/supabase/proof.ts
export class SupabasePaymentProofRepository implements PaymentProofRepository {
  async upload(input: { orderId: string; uploadedBy: string; dataUrl: string; fileName: string }) {
    const blob = dataUrlToBlob(input.dataUrl); // decode base64 → Blob
    const path = `${input.orderId}/${Date.now()}-${input.fileName}`;
    const { error } = await supabase.storage
      .from("payment-proofs")          // bucket PRIVATE
      .upload(path, blob, { contentType: blob.type });
    if (error) throw new Error("Gagal mengunggah bukti pembayaran.");
    // simpan metadata + URL bertanda tangan (ber masa berlaku) ke tabel payment_proofs
    const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
    return insertProofRow({ ...input, url: signed!.signedUrl });
  }
}
```

- Halaman `/pembayaran` sudah memvalidasi & mengompresi gambar di klien (canvas) — tinggal kirim `dataUrl` ke repository (tidak ada perubahan UI).
- Bucket privat + kebijakan: pasien menulis miliknya, admin membaca semua.
- Gambar chat (`ChatMessage.imageDataUrl`) mengikuti pola sama (`image_url`).

## 6. Chat: LocalStorage → Supabase Realtime

```ts
// hooks/useRealtimeMessages.ts (pengganti listener CustomEvent)
useEffect(() => {
  const channel = supabase
    .channel(`consultation:${id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `consultation_id=eq.${id}` },
      (payload) => appendMessage(toChatMessage(payload.new))
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [id]);
```

Komponen `ChatWindow` menerima `messages` lewat props — cukup ganti sumber data di halaman, komponen bubble/scroll/input tetap.

## 7. Notifikasi

Pola sama dengan chat: tabel `notifications` + Realtime `INSERT` (filter `patient_id=eq.<uid>` atau `audience=eq.admin`), mempertahankan bentuk `AppNotification` sehingga `NotificationsProvider` hanya berganti loader.

## 8. Ongkir dari API Ekspedisi

```ts
// repositories/supabase/shipping.ts
async estimate(method: FulfillmentMethod, address?: Address): Promise<number> {
  if (method === "pickup") return 0;
  const { data } = await supabase.functions.invoke("shipping-cost", { body: { destination: address } });
  return data.cost; // edge function memanggil RajaOngkir/Biteship
}
```

UI checkout/pembayaran sudah memanggil `estimate()` — tidak ada perubahan tampilan.

## 9. Urutan Pengerjaan yang Disarankan

1. Buat project Supabase + jalankan skema SQL + seed dari `data/*.json`.
2. Pasang `@supabase/supabase-js`, buat `lib/supabase.ts` (client browser & server).
3. Ganti `authService` → Supabase Auth; tabel `profiles`.
4. Tulis `SupabaseProductRepository` + `SupabaseCategoryRepository` (read-only dulu) → tes katalog & detail.
5. Cart & Order (transaksi stok via RPC atomic).
6. `SupabasePaymentProofRepository` (Storage) + verifikasi admin.
7. Chat + Notifikasi (Realtime).
8. Aktifkan RLS untuk semua tabel; uji sebagai pasien & admin.
9. Hapus `repositories/local/*` (atau simpan sebagai fallback offline opsional bersama service worker).

## 10. Variabel Lingkungan

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# NEXT_PUBLIC_APP_URL dipakai untuk metadata SEO
```

service role key **tidak boleh** dikirim ke klien — operasi admin dilakukan lewat RLS (sesi admin) atau edge function.
