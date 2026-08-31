"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff, KeyRound, LogIn, Pill, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const DEMO_ACCOUNTS = [
    { label: "Pasien (Deni)", email: "deni@sehatku.id", password: "password123" },
    { label: "Pasien (Sari)", email: "sari@sehatku.id", password: "password123" },
    { label: "Admin / Apoteker", email: "admin@sehatku.id", password: "admin123" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(email, password);
      toast(`Selamat datang, ${session.name.split(" ")[0]}!`, "success");
      const next = params.get("next");
      router.replace(next ?? (session.role === "admin" ? "/admin" : "/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
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
          <h1 className="mt-3 text-xl font-extrabold text-slate-800">Masuk ke Akun Anda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola pesanan & konsultasi Anda di Apotek Sehatku
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              label="Kata Sandi"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute right-3 top-[38px] flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            <LogIn size={18} aria-hidden /> Masuk
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-primary-600">
            Daftar
          </Link>
        </p>
      </div>

      {/* Akun demo — prototype saja */}
      <div className="mt-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-600/15">
        <p className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
          <KeyRound size={13} aria-hidden /> Akun demo (prototype)
        </p>
        <div className="mt-2.5 grid gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.password);
              }}
              className="flex min-h-[44px] items-center justify-between rounded-xl bg-white px-3.5 text-left ring-1 ring-sky-600/10 hover:bg-sky-50"
            >
              <span>
                <span className="block text-xs font-bold text-slate-700">{acc.label}</span>
                <span className="block text-[11px] text-slate-400">
                  {acc.email} · {acc.password}
                </span>
              </span>
              <span className="text-[10px] font-bold text-sky-600">ISI OTOMATIS</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-center text-[11px] leading-relaxed text-slate-400">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden />
        Autentikasi prototype (LocalStorage) — production menggunakan autentikasi backend yang
        aman. Password tidak disimpan mentah di perangkat Anda.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-6"><Skeleton className="h-96 w-full rounded-3xl" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
