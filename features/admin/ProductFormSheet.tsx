"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { compressImageFile } from "@/lib/image";
import { generateId, nowISO } from "@/lib/id";
import { PRESET_PRODUCT_IMAGES } from "@/lib/constants";
import { getRepositories } from "@/repositories";
import type { Category, Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null; // null = tambah baru
  categories: Category[];
}

/** Form tambah/edit produk — bottom sheet di HP, modal di desktop */
export function ProductFormSheet({ open, onClose, onSaved, product, categories }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customUploading, setCustomUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    categoryId: "",
    price: "",
    stock: "",
    unit: "",
    image: PRESET_PRODUCT_IMAGES[0],
    description: "",
    usage: "",
    additionalInfo: "",
    requiresPrescription: false,
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (product) {
      setForm({
        name: product.name,
        brand: product.brand ?? "",
        categoryId: product.categoryId,
        price: String(product.price),
        stock: String(product.stock),
        unit: product.unit ?? "",
        image: product.image,
        description: product.description,
        usage: product.usage ?? "",
        additionalInfo: product.additionalInfo ?? "",
        requiresPrescription: Boolean(product.requiresPrescription),
        isActive: product.isActive,
      });
    } else {
      setForm({
        name: "",
        brand: "",
        categoryId: categories[0]?.id ?? "",
        price: "",
        stock: "",
        unit: "",
        image: PRESET_PRODUCT_IMAGES[0],
        description: "",
        usage: "",
        additionalInfo: "",
        requiresPrescription: false,
        isActive: true,
      });
    }
  }, [open, product, categories]);

  const setField = (k: string, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCustomUploading(true);
    try {
      const processed = await compressImageFile(file, 700, 0.75);
      setField("image", processed.dataUrl);
      toast("Foto produk siap disimpan", "success");
    } catch {
      toast("Gagal memproses gambar", "error");
    } finally {
      setCustomUploading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Nama produk minimal 3 karakter";
    if (!form.categoryId) e.categoryId = "Pilih kategori";
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0) e.price = "Harga harus > 0";
    const stock = Number(form.stock);
    if (form.stock === "" || Number.isNaN(stock) || stock < 0) e.stock = "Stok tidak valid";
    if (form.description.trim().length < 10) e.description = "Deskripsi minimal 10 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast("Periksa kembali isian formulir", "warning");
      return;
    }
    setSaving(true);
    try {
      const now = nowISO();
      const saved: Product = {
        id: product?.id ?? generateId("MED"),
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        categoryId: form.categoryId,
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit.trim() || undefined,
        image: form.image,
        description: form.description.trim(),
        usage: form.usage.trim() || undefined,
        additionalInfo: form.additionalInfo.trim() || undefined,
        rating: product?.rating ?? 0,
        sold: product?.sold ?? 0,
        isActive: form.isActive,
        isPopular: product?.isPopular,
        isNew: product?.isNew,
        requiresPrescription: form.requiresPrescription,
        createdAt: product?.createdAt ?? now,
      };
      await getRepositories().products.save(saved);
      toast(product ? "Produk diperbarui" : "Produk baru ditambahkan", "success");
      onSaved();
      onClose();
    } catch {
      toast("Gagal menyimpan produk", "error");
    } finally {
      setSaving(false);
    }
  };

  const isCustomImage = form.image.startsWith("data:");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={product ? "Edit Produk" : "Tambah Obat Baru"}
      footer={
        <Button fullWidth size="lg" loading={saving} onClick={save}>
          {product ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nama Obat"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
          placeholder="cth: Paracetamol 500 mg Tablet"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Merek (opsional)"
            value={form.brand}
            onChange={(e) => setField("brand", e.target.value)}
            placeholder="cth: Sehatku Generik"
          />
          <Select
            label="Kategori"
            value={form.categoryId}
            onChange={(e) => setField("categoryId", e.target.value)}
            error={errors.categoryId}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Harga (Rp)"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.price}
            onChange={(e) => setField("price", e.target.value)}
            error={errors.price}
            placeholder="cth: 5000"
            required
          />
          <Input
            label="Stok"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.stock}
            onChange={(e) => setField("stock", e.target.value)}
            error={errors.stock}
            placeholder="cth: 100"
            required
          />
        </div>
        <Input
          label="Kemasan / Satuan"
          value={form.unit}
          onChange={(e) => setField("unit", e.target.value)}
          placeholder="cth: strip 10 tablet"
        />

        {/* Pemilih gambar */}
        <div>
          <p className="mb-1.5 text-sm font-semibold text-slate-700">
            Foto Produk <span className="text-red-500">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PRODUCT_IMAGES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setField("image", src)}
                aria-label={`Pilih gambar ${src}`}
                aria-pressed={form.image === src}
                className={`relative h-16 w-16 overflow-hidden rounded-xl ring-2 transition-colors ${
                  form.image === src ? "ring-primary-600" : "ring-transparent hover:ring-slate-300"
                }`}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
          <label className="mt-2 flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-600 hover:border-primary-400">
            <Upload size={15} aria-hidden />
            {customUploading ? "Memproses…" : isCustomImage ? "Ganti foto unggahan" : "Upload foto sendiri"}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" aria-label="Unggah foto produk" />
          </label>
          {isCustomImage && (
            <div className="relative mt-2 inline-block overflow-hidden rounded-xl ring-2 ring-primary-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image} alt="Foto produk unggahan" className="h-16 w-16 object-cover" />
            </div>
          )}
        </div>

        <Textarea
          label="Deskripsi"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          error={errors.description}
          rows={3}
          required
        />
        <Textarea
          label="Aturan Penggunaan"
          value={form.usage}
          onChange={(e) => setField("usage", e.target.value)}
          rows={2}
          placeholder="cth: Dewasa: 1 tablet 3 kali sehari setelah makan"
        />
        <Textarea
          label="Informasi Tambahan (opsional)"
          value={form.additionalInfo}
          onChange={(e) => setField("additionalInfo", e.target.value)}
          rows={2}
        />

        <label className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3.5">
          <span>
            <span className="block text-sm font-bold text-slate-700">Butuh Resep Dokter</span>
            <span className="block text-[11px] text-slate-400">Tampilkan peringatan obat keras</span>
          </span>
          <input
            type="checkbox"
            checked={form.requiresPrescription}
            onChange={(e) => setField("requiresPrescription", e.target.checked)}
            className="h-5 w-5 accent-primary-600"
          />
        </label>
        <label className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3.5">
          <span>
            <span className="block text-sm font-bold text-slate-700">Produk Aktif</span>
            <span className="block text-[11px] text-slate-400">Tampil di katalog pelanggan</span>
          </span>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setField("isActive", e.target.checked)}
            className="h-5 w-5 accent-primary-600"
          />
        </label>
      </div>
    </BottomSheet>
  );
}
