# 📱 Apotek Sehatku — Platform Pemesanan Obat & Konsultasi Apoteker

Aplikasi web **mobile-first** untuk platform pemesanan obat, konsultasi obat, pembayaran, dan pengelolaan pesanan. Dirancang terutama untuk **Android smartphone** (360–430px), tetap responsive di tablet & desktop.

> ⚠️ **Prototype pembelajaran** — bukan layanan medis sesungguhnya. Informasi dalam aplikasi ini bukan pengganti diagnosis atau pemeriksaan tenaga kesehatan.

## ✨ Fitur

### Pasien
- **Katalog** — 29 obat dummy, 8 kategori, search real-time (nama/kategori/deskripsi, debounced)
- **Filter** harga, kategori, stok + sorting (popularitas/harga/rating/terbaru) via **bottom sheet**
- **Detail obat** — deskripsi, aturan pakai, info tambahan, peringatan obat resep
- **Keranjang** — pilih semua, ubah jumlah, hapus, validasi stok, badge realtime di bottom nav
- **Checkout bertahap** — data pasien → ambil di tempat / diantar (form alamat lengkap) → ringkaman + ongkir
- **Pembayaran** — Transfer Bank (salin rekening) / QRIS, upload bukti dengan preview & kompresi gambar
- **Status pesanan** — timeline visual, alasan penolakan pembayaran, batalkan pesanan
- **Riwayat pesanan** — filter Semua / Belum Dibayar / Diproses / Selesai / Dibatalkan
- **Konsultasi chat** — fullscreen chat, kirim teks/foto, rekomendasi obat dari apoteker dengan tombol **Lihat Produk** & **Tambah ke Keranjang** tanpa keluar dari chat
- **Notifikasi** — pusat notifikasi dengan badge lonceng
- **Akun** — login, register, profil, logout (prototype auth)

### Admin / Apoteker
- **Dashboard** — 6 kartu statistik + grafik pesanan & pendapatan 7 hari
- **Kelola produk** — CRUD, aktif/nonaktif, atur stok/harga, pilih/upload foto, kategori
- **Kelola pesanan** — cari, filter status, konfirmasi/tolak pembayaran (**alasan wajib**), atur ongkir per pesanan, ubah status, lihat bukti pembayaran
- **Kelola konsultasi** — balas chat, **rekomendasikan produk** lewat pencarian
- **Pengaturan** — ongkir, lokasi ambil di tempat, kategori, metode pembayaran, reset data prototype

## 🧰 Teknologi

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS (mobile-first breakpoints `base → sm → md → lg → xl`) |
| Ikon | Lucide React |
| Data seed | JSON (`data/*.json`) |
| Data mutable | LocalStorage (via repository layer) |
| Deployment | Vercel |

## 🏗️ Arsitektur

```
app/                  # Halaman (App Router) — (shop) pasien, admin/ terguard
components/           # UI reusable: ui/ (Button, BottomSheet, Skeleton…), layout/ (BottomNav, AppHeader)
features/             # Fitur per domain: product, cart, orders, chat, admin, home
hooks/                # Providers + hooks: useAuth, useCart, useToast, useNotifications, useDebounce
lib/                  # Util murni: format, storage, auth (otorisasi), image, id, constants
repositories/         # Abstraksi akses data (interface + implementasi)
  ├─ types.ts         # Kontrak ProductRepository, OrderRepository, PaymentProofRepository, …
  ├─ json/            # Json*Repository — baca seed JSON (server/SSR, read-only)
  ├─ local/           # Local*Repository — LocalStorage + overlay seed (client, mutable)
  └─ index.ts         # Service locator (server → JSON, browser → Local)
services/             # Business logic + otorisasi: order, payment, chat, auth, notification
types/                # Tipe domain (Product, Order, Payment, ChatMessage, …)
data/                 # medicines, categories, payment-methods, shipping, users, orders, payments, consultations
public/               # Ikon PWA, gambar produk, service worker
```

**Prinsip:** UI → Service → Repository → (JSON | LocalStorage). Komponen tidak pernah memanggil `localStorage` langsung — saat berpindah ke Supabase cukup ganti implementasi repository (lihat [`MIGRATION_TO_SUPABASE.md`](./MIGRATION_TO_SUPABASE.md)).

## 🚀 Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Deploy ke Vercel: push ke GitHub → import project → deploy (tanpa konfigurasi tambahan).

## 👤 Akun Demo

| Peran | Email | Password |
|---|---|---|
| Admin / Apoteker | `admin@sehatku.id` | `admin123` |
| Pasien (Deni) | `deni@sehatku.id` | `password123` |
| Pasien (Budi) | `budi@sehatku.id` | `password123` |
| Pasien (Sari) | `sari@sehatku.id` | `password123` |

> Semua akun dummy — tidak ada data pasien nyata. Tanpa login pun bisa memesan (guest), dan konsultasi tetap tersedia.

**Alur demo yang disarankan:**
1. Login pasien Deni → lihat riwayat pesanan & konsultasi berisi data seed.
2. Buat pesanan baru: cari obat → keranjang → checkout → pilih metode → upload bukti.
3. Buka tab/halaman `/admin` (login admin) → verifikasi pembayaran, ubah status, balas konsultasi + rekomendasikan produk.
4. Kembali ke akun pasien → notifikasi, status pesanan, dan rekomendasi di chat diperbarui.

## 💾 Catatan Penyimpanan (Prototype)

- Data mutable tersimpan di **LocalStorage browser** (`apotek:*`) — per perangkat, maksimum ±5 MB.
- Bukti pembayaran disimpan sebagai data URL base64 **hanya simulasi**; production memakai Supabase Storage (`PaymentProofRepository` tinggal ditukar).
- Password tidak disimpan mentah di LocalStorage (hash demo) — production wajib auth backend (Supabase Auth).
- Admin → Pengaturan → **Reset Data Prototype** mengembalikan semua data ke seed JSON.

## 📱 PWA

- `manifest.webmanifest` (installable, shortcuts Obat/Konsultasi/Pesanan)
- Service worker: app shell network-first, aset cache-first, fallback `/offline`
- Katalog yang pernah dibuka tetap dapat diakses offline

## ♿ Aksesibilitas & Performa

- Touch target minimal 44px, label & aria-label pada tombol/input/ikon
- Kontras warna memadai (WCAG AA), focus state jelas, semantic HTML
- Skeleton loading di semua halaman data, empty state & error state tanpa stack trace
- Search debounced, kompresi gambar upload (canvas), chart ringan tanpa library, first-load JS ±87 kB shared
