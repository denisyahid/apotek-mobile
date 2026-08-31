import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ClipboardList, MessageCircleHeart, ShieldCheck, Truck } from "lucide-react";
import { HomeSearchBar } from "@/features/home/HomeSearchBar";
import { CategoryIcon } from "@/features/product/CategoryIcon";
import { ProductCard, ProductCardMini } from "@/features/product/ProductCard";
import { SectionHeader } from "@/components/ui/Misc";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { jsonRepositories } from "@/repositories";

export const dynamic = "force-static";

/** HOME (server component, SEO-friendly) — data dari JSON seed */
export default async function HomePage() {
  const [categories, popular, recommended, newest] = await Promise.all([
    jsonRepositories.categories.getAll(),
    jsonRepositories.products.getAll({ sort: "popular", limit: 6 }),
    jsonRepositories.products.getAll({ sort: "rating", limit: 6 }),
    jsonRepositories.products.getAll({ sort: "newest", limit: 6 }),
  ]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 pt-4">
      {/* Search */}
      <HomeSearchBar />

      {/* Banner konsultasi */}
      <section
        aria-labelledby="konsultasi-heading"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-5 text-white shadow-lg"
      >
        <div
          aria-hidden
          className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide">
            <MessageCircleHeart size={13} aria-hidden /> GRATIS · Dibalas Apoteker
          </p>
          <h1 id="konsultasi-heading" className="mt-3 text-xl font-extrabold leading-snug">
            Konsultasikan kebutuhan obat Anda
          </h1>
          <p className="mt-1.5 max-w-[26ch] text-sm leading-relaxed text-primary-50">
            Bingung pilih obat? Tanya apoteker kami lewat chat dan dapatkan rekomendasi yang tepat.
          </p>
          <Link
            href="/konsultasi"
            className="mt-4 inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-primary-700 shadow-sm transition-transform active:scale-95"
          >
            Konsultasi Sekarang <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Kategori — horizontal scroll */}
      <section aria-labelledby="kategori-heading">
        <SectionHeader title="Kategori" />
        <h2 id="kategori-heading" className="sr-only">
          Kategori produk
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x-mandatory">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/obat?kategori=${cat.slug}`}
              className="flex w-[5.5rem] shrink-0 snap-start-always flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-card ring-1 ring-slate-900/5 transition-colors hover:bg-primary-50 active:bg-primary-100"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <CategoryIcon icon={cat.icon} />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-slate-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produk populer — grid 2 kolom di HP */}
      <section aria-labelledby="populer-heading">
        <SectionHeader
          title="Produk Populer"
          action={
            <Link
              href="/obat?sort=popular"
              className="flex min-h-[44px] items-center gap-0.5 text-sm font-bold text-primary-600"
            >
              Lihat Semua <ChevronRight size={16} aria-hidden />
            </Link>
          }
        />
        <h2 id="populer-heading" className="sr-only">
          Produk populer
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </div>
      </section>

      {/* Keunggulan layanan */}
      <section aria-label="Keunggulan layanan" className="grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, title: "Apoteker Berlisensi", desc: "Obat asli & terjamin" },
          { icon: Truck, title: "Ambil / Diantar", desc: "Fleksibel sesuai kebutuhan" },
          { icon: ClipboardList, title: "Tanpa Antre", desc: "Pesan dalam 2 menit" },
        ].map((f) => (
          <div
            key={f.title}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-card ring-1 ring-slate-900/5"
          >
            <f.icon size={22} className="text-primary-600" aria-hidden />
            <p className="text-xs font-bold text-slate-700">{f.title}</p>
            <p className="text-[10px] leading-tight text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Rekomendasi untuk Anda — kurasi apoteker (bukan diagnosis otomatis) */}
      <section aria-labelledby="rekomendasi-heading">
        <SectionHeader
          title="Rekomendasi untuk Anda"
          action={
            <Link href="/konsultasi" className="flex min-h-[44px] items-center text-sm font-bold text-primary-600">
              Tanya Apoteker
            </Link>
          }
        />
        <h2 id="rekomendasi-heading" className="sr-only">
          Rekomendasi untuk Anda
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x-mandatory">
          {recommended.map((p) => (
            <ProductCardMini key={p.id} product={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </div>
      </section>

      {/* Produk terbaru */}
      <section aria-labelledby="terbaru-heading">
        <SectionHeader title="Produk Terbaru" />
        <h2 id="terbaru-heading" className="sr-only">
          Produk terbaru
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={categoryName(p.categoryId)} />
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="space-y-3 pb-2 pt-2 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
          <Image
            src="/icons/icon.svg"
            alt=""
            width={20}
            height={20}
            className="rounded-md"
            aria-hidden
          />
          Apotek Sehatku
        </div>
        <p className="mx-auto max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-600/15">
          ⚠️ {MEDICAL_DISCLAIMER}
        </p>
        <p className="text-[11px] text-slate-400">
          © 2026 Apotek Sehatku · Prototype pembelajaran — bukan layanan medis sesungguhnya.
        </p>
      </footer>
    </div>
  );
}
