"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pill, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setField = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Nama minimal 3 karakter";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email tidak valid";
    if (!/^[0-9+\-\s]{9,16}$/.test(form.phone)) e.phone = "Nomor HP tidak valid";
    if (form.password.length < 8) e.password = "Kata sandi minimal 8 karakter";
    if (form.confirm !== form.password) e.confirm = "Konfirmasi kata sandi tidak sama";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast("Pendaftaran berhasil. Selamat datang!", "success");
      router.replace("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mendaftar", "error");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-600 text-white shadow-md">
            <Pill size={26} aria-hidden />
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-slate-800">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-slate-500">Gratis — pesan obat & konsultasi apoteker</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label="Nama Lengkap"
            autoComplete="name"
            placeholder="cth: Deni Kurniawan"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Nomor HP / WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx-xxxx-xxxx"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
            required
          />
          <Input
            label="Kata Sandi"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            error={errors.password}
            hint="Jangan bagikan kata sandi Anda kepada siapa pun"
            required
          />
          <Input
            label="Konfirmasi Kata Sandi"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={form.confirm}
            onChange={(e) => setField("confirm", e.target.value)}
            error={errors.confirm}
            required
          />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            <UserPlus size={18} aria-hidden /> Daftar
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-bold text-primary-600">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
