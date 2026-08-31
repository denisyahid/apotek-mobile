"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Shapes,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { CopyButton } from "@/components/ui/Misc";
import { ErrorState, ListSkeleton } from "@/components/ui/StateViews";
import { useToast } from "@/hooks/useToast";
import { generateId } from "@/lib/id";
import { clearPrototypeData } from "@/lib/storage";
import { getRepositories } from "@/repositories";
import { paymentService } from "@/services/paymentService";
import type { Category, PaymentMethod, ShippingConfig } from "@/types";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [shipping, setShipping] = useState<ShippingConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [catSheet, setCatSheet] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", icon: "pill", description: "" });
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const repo = getRepositories();
      setShipping(await repo.shipping.getConfig());
      setCategories(await repo.categories.getAll());
      setMethods(await paymentService.getMethods());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveShipping = async () => {
    if (!shipping) return;
    if (shipping.shippingCost < 0) {
      toast("Ongkos kirim tidak valid", "warning");
      return;
    }
    setSavingShipping(true);
    try {
      await getRepositories().shipping.saveConfig(shipping);
      toast("Pengaturan pengiriman tersimpan", "success");
    } catch {
      toast("Gagal menyimpan", "error");
    } finally {
      setSavingShipping(false);
    }
  };

  const openCatSheet = (cat?: Category) => {
    setEditingCat(cat ?? null);
    setCatForm({
      name: cat?.name ?? "",
      icon: cat?.icon ?? "pill",
      description: cat?.description ?? "",
    });
    setCatSheet(true);
  };

  const saveCategory = async () => {
    if (catForm.name.trim().length < 3) {
      toast("Nama kategori minimal 3 karakter", "warning");
      return;
    }
    const cat: Category = {
      id: editingCat?.id ?? generateId("CAT"),
      name: catForm.name.trim(),
      slug:
        editingCat?.slug ??
        catForm.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      icon: catForm.icon,
      description: catForm.description.trim() || undefined,
    };
    await getRepositories().categories.save(cat);
    toast(editingCat ? "Kategori diperbarui" : "Kategori ditambahkan", "success");
    setCatSheet(false);
    load();
  };

  const deleteCategory = async (cat: Category) => {
    await getRepositories().categories.remove(cat.id);
    toast(`Kategori ${cat.name} dihapus`, "success");
    load();
  };

  const doReset = () => {
    clearPrototypeData();
    toast("Data prototype direset — memuat ulang…", "success");
    window.setTimeout(() => window.location.reload(), 600);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ListSkeleton rows={4} />
      </div>
    );
  }
  if (error || !shipping) return <ErrorState onRetry={load} />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-extrabold text-slate-800">Pengaturan</h1>

      {/* Pengiriman */}
      <section aria-labelledby="shipping-heading" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 id="shipping-heading" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Truck size={16} className="text-primary-600" aria-hidden /> Pengiriman
        </h2>
        <div className="space-y-4">
          <Input
            label="Ongkos Kirim Tetap (Rp)"
            type="number"
            inputMode="numeric"
            min={0}
            value={String(shipping.shippingCost)}
            onChange={(e) =>
              setShipping({ ...shipping, shippingCost: Number(e.target.value) || 0 })
            }
            hint="Berlaku untuk semua pesanan diantar. Production: dihitung via API ekspedisi."
          />
          <Textarea
            label="Catatan Pengiriman (opsional)"
            rows={2}
            value={shipping.note ?? ""}
            onChange={(e) => setShipping({ ...shipping, note: e.target.value })}
          />
          <Button loading={savingShipping} onClick={saveShipping}>
            <Save size={16} aria-hidden /> Simpan Pengiriman
          </Button>
        </div>
      </section>

      {/* Ambil di tempat */}
      <section aria-labelledby="pickup-heading" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 id="pickup-heading" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Store size={16} className="text-primary-600" aria-hidden /> Lokasi Ambil di Tempat
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nama Apotek"
            value={shipping.pickup.name}
            onChange={(e) =>
              setShipping({ ...shipping, pickup: { ...shipping.pickup, name: e.target.value } })
            }
          />
          <Input
            label="Telepon"
            type="tel"
            value={shipping.pickup.phone}
            onChange={(e) =>
              setShipping({ ...shipping, pickup: { ...shipping.pickup, phone: e.target.value } })
            }
          />
          <Input
            label="Alamat"
            value={shipping.pickup.address}
            onChange={(e) =>
              setShipping({ ...shipping, pickup: { ...shipping.pickup, address: e.target.value } })
            }
          />
          <Input
            label="Kota"
            value={shipping.pickup.city}
            onChange={(e) =>
              setShipping({ ...shipping, pickup: { ...shipping.pickup, city: e.target.value } })
            }
          />
          <Input
            label="Jam Operasional"
            className="sm:col-span-2"
            value={shipping.pickup.hours}
            onChange={(e) =>
              setShipping({ ...shipping, pickup: { ...shipping.pickup, hours: e.target.value } })
            }
          />
        </div>
        <Button className="mt-4" loading={savingShipping} onClick={saveShipping}>
          <Save size={16} aria-hidden /> Simpan Lokasi
        </Button>
      </section>

      {/* Kategori */}
      <section aria-labelledby="cat-heading" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="cat-heading" className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Shapes size={16} className="text-primary-600" aria-hidden /> Kategori ({categories.length})
          </h2>
          <Button size="sm" variant="secondary" onClick={() => openCatSheet()}>
            <Plus size={15} aria-hidden /> Tambah
          </Button>
        </div>
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex min-h-[56px] items-center gap-3 py-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-sm font-extrabold text-primary-700">
                {c.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{c.name}</p>
                <p className="truncate text-[11px] text-slate-400">/{c.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => openCatSheet(c)}
                aria-label={`Edit kategori ${c.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100"
              >
                <Pencil size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(c)}
                aria-label={`Hapus kategori ${c.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Metode pembayaran (read-only dari JSON) */}
      <section aria-labelledby="pay-heading" className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
        <h2 id="pay-heading" className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Building2 size={16} className="text-primary-600" aria-hidden /> Metode Pembayaran
        </h2>
        <ul className="space-y-2">
          {methods.map((m) => (
            <li
              key={m.id}
              className="flex min-h-[56px] items-center gap-3 rounded-xl bg-slate-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{m.name}</p>
                {m.accountNumber && (
                  <p className="truncate text-xs text-slate-500">
                    {m.bankName} · {m.accountNumber} · a.n. {m.accountName}
                  </p>
                )}
              </div>
              {m.accountNumber && <CopyButton value={m.accountNumber} compact />}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Data rekening bersumber dari <code>data/payment-methods.json</code> (read-only di
          prototype). Production: kelola di tabel database.
        </p>
      </section>

      {/* Bahaya */}
      <section aria-labelledby="danger-heading" className="rounded-2xl bg-red-50/60 p-4 ring-1 ring-inset ring-red-600/15">
        <h2 id="danger-heading" className="text-sm font-bold text-red-700">
          Data Prototype
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-red-600">
          Semua perubahan (pesanan, chat, produk, pembayaran) tersimpan di LocalStorage browser
          ini. Reset akan mengembalikan seluruh data ke kondisi awal (seed JSON).
        </p>
        <Button variant="danger" className="mt-3" onClick={() => setResetOpen(true)}>
          <RotateCcw size={16} aria-hidden /> Reset Data Prototype
        </Button>
      </section>

      {/* Sheet kategori */}
      <BottomSheet
        open={catSheet}
        onClose={() => setCatSheet(false)}
        title={editingCat ? "Edit Kategori" : "Tambah Kategori"}
        footer={
          <Button fullWidth onClick={saveCategory}>
            Simpan Kategori
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Kategori"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            placeholder="cth: Obat Bebas"
            required
          />
          <Input
            label="Ikon (nama lucide)"
            value={catForm.icon}
            onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
            hint="pill, citrus, dumbbell, sparkles, baby, stethoscope, leaf, package"
          />
          <Textarea
            label="Deskripsi (opsional)"
            rows={2}
            value={catForm.description}
            onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
          />
        </div>
      </BottomSheet>

      {/* Sheet reset */}
      <BottomSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Semua Data?"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" fullWidth onClick={doReset}>
              Ya, Reset
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Seluruh pesanan, konsultasi, pembayaran, dan perubahan produk pada browser ini akan
          dikembalikan ke data awal. Tindakan ini tidak dapat dibatalkan.
        </p>
      </BottomSheet>
    </div>
  );
}
