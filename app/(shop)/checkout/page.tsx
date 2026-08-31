"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { MEDICAL_DISCLAIMER, PROVINCES } from "@/lib/constants";
import { formatIDR } from "@/lib/format";
import { getRepositories } from "@/repositories";
import { orderService } from "@/services/orderService";
import type { FulfillmentMethod, Product, ShippingConfig } from "@/types";

const STEPS = [
  { id: 0, label: "Data Pasien", icon: User },
  { id: 1, label: "Pengambilan", icon: Truck },
  { id: 2, label: "Ringkasan", icon: CreditCard },
] as const;

interface CheckoutProduct {
  product: Product;
  qty: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();
  const { items, clear, ready } = useCart();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shipping, setShipping] = useState<ShippingConfig | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutProduct[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    fulfillment: "delivery" as FulfillmentMethod,
    receiverName: "",
    receiverPhone: "",
    province: "",
    city: "",
    district: "",
    street: "",
    postalCode: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agree, setAgree] = useState(false);
  // cegah redirect ke keranjang ketika pesanan baru saja dibuat (cart dikosongkan)
  const submittedRef = useRef(false);

  // prefill dari sesi login
  useEffect(() => {
    if (session) {
      setForm((f) => ({
        ...f,
        name: f.name || session.name,
      }));
    }
  }, [session]);

  // muat produk + konfigurasi pengiriman
  const load = useCallback(async () => {
    const repo = getRepositories();
    const resolved: CheckoutProduct[] = [];
    for (const item of items) {
      const p = await repo.products.getById(item.productId);
      if (p && p.stock > 0) {
        resolved.push({ product: p, qty: Math.min(item.qty, p.stock) });
      }
    }
    setCheckoutItems(resolved);
    setShipping(await repo.shipping.getConfig());
    setLoading(false);
  }, [items]);

  useEffect(() => {
    if (!ready || submittedRef.current) return;
    if (items.length === 0) {
      router.replace("/keranjang");
      return;
    }
    load();
  }, [ready, items.length, load, router]);

  const subtotal = useMemo(
    () => checkoutItems.reduce((s, i) => s + i.product.price * i.qty, 0),
    [checkoutItems]
  );
  const shippingCost =
    form.fulfillment === "pickup" ? 0 : (shipping?.shippingCost ?? 0);
  const total = subtotal + shippingCost;

  const setField = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validateStep = (target: number): boolean => {
    const e: Record<string, string> = {};
    if (target > 0) {
      if (!form.name.trim()) e.name = "Nama wajib diisi";
      if (!/^[0-9+\-\s]{9,16}$/.test(form.phone.trim())) e.phone = "Nomor HP tidak valid (9–16 digit)";
    }
    if (target > 1 && form.fulfillment === "delivery") {
      if (!form.receiverName.trim()) e.receiverName = "Nama penerima wajib diisi";
      if (!/^[0-9+\-\s]{9,16}$/.test(form.receiverPhone.trim()))
        e.receiverPhone = "Nomor HP penerima tidak valid";
      if (!form.province) e.province = "Pilih provinsi";
      if (!form.city.trim()) e.city = "Kota/kabupaten wajib diisi";
      if (!form.district.trim()) e.district = "Kecamatan wajib diisi";
      if (!form.street.trim()) e.street = "Alamat lengkap wajib diisi";
      if (form.postalCode && !/^[0-9]{5}$/.test(form.postalCode))
        e.postalCode = "Kode pos harus 5 digit";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step + 1)) {
      toast("Lengkapi data yang ditandai merah", "warning");
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOrder = async () => {
    if (!agree) {
      toast("Setujui disclaimer terlebih dahulu", "warning");
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        actor: session,
        patientName: form.name,
        patientPhone: form.phone,
        items: checkoutItems,
        fulfillment: form.fulfillment,
        address:
          form.fulfillment === "delivery"
            ? {
                receiverName: form.receiverName,
                receiverPhone: form.receiverPhone,
                province: form.province,
                city: form.city,
                district: form.district,
                street: form.street,
                postalCode: form.postalCode,
                note: form.note || undefined,
              }
            : undefined,
      });
      clear();
      toast(`Pesanan ${order.id} berhasil dibuat`, "success");
      router.replace(`/pembayaran/${order.id}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat pesanan", "error");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <EmptyState
          title="Tidak ada item untuk di-checkout"
          description="Keranjang Anda kosong atau semua produk sedang habis."
          action={
            <Link
              href="/obat"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
            >
              Mulai Belanja
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-36">
      {/* Header + stepper */}
      <div className="flex items-center gap-2">
        <Link
          href="/keranjang"
          aria-label="Kembali ke keranjang"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft size={20} aria-hidden />
        </Link>
        <h1 className="text-lg font-extrabold text-slate-800">Checkout</h1>
      </div>

      <ol className="mt-4 flex items-center" aria-label="Langkah checkout">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    state === "done"
                      ? "bg-primary-600 text-white"
                      : state === "current"
                        ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {state === "done" ? <Check size={16} aria-hidden /> : i + 1}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    state === "todo" ? "text-slate-400" : "text-slate-700"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-1 mb-4 h-0.5 flex-1 rounded ${
                    i < step ? "bg-primary-600" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* STEP 1: Data pasien */}
      {step === 0 && (
        <section aria-label="Data pasien" className="mt-5 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <User size={16} className="text-primary-600" aria-hidden /> Data Pasien
            </h2>
            <div className="space-y-4">
              <Input
                label="Nama Lengkap"
                placeholder="cth: Deni Kurniawan"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                error={errors.name}
                required
              />
              <Input
                label="Nomor HP / WhatsApp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="cth: 0812-3456-7890"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                error={errors.phone}
                hint="Nomor ini dipakai apoteker untuk menghubungi Anda"
                required
              />
            </div>
          </div>
          <p className="rounded-2xl bg-sky-50 p-3.5 text-xs leading-relaxed text-sky-800">
            💡 Belum login? Tidak masalah — Anda tetap bisa memesan. Login untuk menyimpan
            riwayat pesanan Anda di perangkat ini.
          </p>
        </section>
      )}

      {/* STEP 2: Metode mendapatkan obat */}
      {step === 1 && (
        <section aria-label="Metode pengambilan" className="mt-5 space-y-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Pilih metode mendapatkan obat</legend>

            {/* Ambil di tempat */}
            <label
              className={`flex cursor-pointer gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 transition-colors ${
                form.fulfillment === "pickup" ? "ring-2 ring-primary-600" : "ring-slate-900/5"
              }`}
            >
              <input
                type="radio"
                name="fulfillment"
                className="mt-1 h-5 w-5 accent-primary-600"
                checked={form.fulfillment === "pickup"}
                onChange={() => setForm((f) => ({ ...f, fulfillment: "pickup" }))}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Store size={17} className="text-primary-600" aria-hidden />
                  <span className="text-sm font-bold text-slate-800">Ambil di Tempat</span>
                  <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                    Gratis
                  </span>
                </div>
                {shipping && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    <strong className="text-slate-700">{shipping.pickup.name}</strong>
                    <br />
                    {shipping.pickup.address}, {shipping.pickup.city}
                    <br />
                    {shipping.pickup.hours}
                  </p>
                )}
              </div>
            </label>

            {/* Diantar */}
            <label
              className={`flex cursor-pointer gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 transition-colors ${
                form.fulfillment === "delivery" ? "ring-2 ring-primary-600" : "ring-slate-900/5"
              }`}
            >
              <input
                type="radio"
                name="fulfillment"
                className="mt-1 h-5 w-5 accent-primary-600"
                checked={form.fulfillment === "delivery"}
                onChange={() => setForm((f) => ({ ...f, fulfillment: "delivery" }))}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Truck size={17} className="text-primary-600" aria-hidden />
                  <span className="text-sm font-bold text-slate-800">Diantar ke Alamat</span>
                  <span className="ml-auto rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700 ring-1 ring-inset ring-primary-600/20">
                    {formatIDR(shipping?.shippingCost ?? 0)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Estimasi tiba 1–3 hari kerja setelah pembayaran dikonfirmasi.
                </p>
              </div>
            </label>
          </fieldset>

          {/* Form alamat pengiriman */}
          {form.fulfillment === "delivery" && (
            <div className="space-y-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MapPin size={16} className="text-primary-600" aria-hidden /> Alamat Pengiriman
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nama Penerima"
                  value={form.receiverName || form.name}
                  onChange={(e) => setField("receiverName", e.target.value)}
                  error={errors.receiverName}
                  autoComplete="name"
                  required
                />
                <Input
                  label="Nomor HP Penerima"
                  type="tel"
                  inputMode="tel"
                  value={form.receiverPhone || form.phone}
                  onChange={(e) => setField("receiverPhone", e.target.value)}
                  error={errors.receiverPhone}
                  autoComplete="tel"
                  required
                />
                <Select
                  label="Provinsi"
                  value={form.province}
                  onChange={(e) => setField("province", e.target.value)}
                  error={errors.province}
                  required
                >
                  <option value="">Pilih provinsi…</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Kota / Kabupaten"
                  placeholder="cth: Jakarta Selatan"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  error={errors.city}
                  required
                />
                <Input
                  label="Kecamatan"
                  placeholder="cth: Tebet"
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  error={errors.district}
                  required
                />
                <Input
                  label="Kode Pos"
                  inputMode="numeric"
                  placeholder="cth: 12820"
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                  error={errors.postalCode}
                />
              </div>
              <Textarea
                label="Alamat Lengkap"
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan…"
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
                error={errors.street}
                required
              />
              <Textarea
                label="Catatan Kurir (opsional)"
                placeholder="cth: Titip ke satpam jika tidak ada di rumah"
                rows={2}
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
              />
            </div>
          )}
        </section>
      )}

      {/* STEP 3: Ringkasan */}
      {step === 2 && (
        <section aria-label="Ringkasan pesanan" className="mt-5 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Produk Dipesan</h2>
            <ul className="divide-y divide-slate-100">
              {checkoutItems.map(({ product, qty }) => (
                <li key={product.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-400">
                      {qty} × {formatIDR(product.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {formatIDR(product.price * qty)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Ringkasan biaya */}
          <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Ringkasan Biaya</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal Obat</dt>
                <dd className="font-semibold text-slate-800">{formatIDR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">
                  Ongkos Kirim{" "}
                  <span className="text-xs text-slate-400">
                    ({form.fulfillment === "pickup" ? "ambil di tempat" : "diantar"})
                  </span>
                </dt>
                <dd className={`font-semibold ${shippingCost === 0 ? "text-green-600" : "text-slate-800"}`}>
                  {shippingCost === 0 ? "Gratis" : formatIDR(shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-base">
                <dt className="font-bold text-slate-800">Total</dt>
                <dd className="font-extrabold text-primary-700">{formatIDR(total)}</dd>
              </div>
            </dl>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              {form.fulfillment === "pickup" ? (
                <>
                  <Store size={13} className="mr-1 inline" aria-hidden /> Ambil di{" "}
                  {shipping?.pickup.name} — {shipping?.pickup.hours}
                </>
              ) : (
                <>
                  <MapPin size={13} className="mr-1 inline" aria-hidden /> {form.receiverName} ·{" "}
                  {form.street}, {form.district}, {form.city}, {form.province} {form.postalCode}
                </>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-600/15">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-primary-600"
              aria-label="Setuju disclaimer layanan"
            />
            <span className="text-xs leading-relaxed text-amber-800">
              Saya memahami bahwa <strong>{MEDICAL_DISCLAIMER}</strong> Untuk obat yang memerlukan
              resep, saya siap menunjukkan resep dokter saat verifikasi apoteker.
            </span>
          </label>
        </section>
      )}

      {/* Sticky bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-nav backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} aria-label="Kembali ke langkah sebelumnya">
              <ChevronLeft size={18} aria-hidden /> Kembali
            </Button>
          ) : (
            <div className="flex-1">
              <p className="text-xs text-slate-500">
                {checkoutItems.length} produk
              </p>
              <p className="text-base font-extrabold text-slate-900">{formatIDR(total)}</p>
            </div>
          )}
          {step < 2 ? (
            <Button size="lg" className="flex-1" onClick={next}>
              Lanjutkan
            </Button>
          ) : (
            <Button size="lg" className="flex-1" loading={submitting} onClick={submitOrder}>
              <ShieldCheck size={18} aria-hidden /> Buat Pesanan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
