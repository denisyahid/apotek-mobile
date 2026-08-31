"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(email, password);
      if (session.role !== "admin") {
        setError("Akun ini bukan admin. Gunakan halaman masuk pasien.");
        setLoading(false);
        return;
      }
      toast("Selamat bertugas, Apoteker!", "success");
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-600 text-white shadow-md">
              <ShieldCheck size={26} aria-hidden />
            </span>
            <h1 className="mt-3 text-xl font-extrabold text-slate-800">Login Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Dashboard pengelolaan Apotek Sehatku</p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Input
              label="Email Admin"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="admin@sehatku.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" fullWidth loading={loading}>
              <LogIn size={18} aria-hidden /> Masuk sebagai Admin
            </Button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => {
            setEmail("admin@sehatku.id");
            setPassword("admin123");
          }}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-violet-50 p-4 text-left ring-1 ring-inset ring-violet-600/15"
        >
          <span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-violet-800">
              <KeyRound size={13} aria-hidden /> Akun demo admin
            </span>
            <span className="mt-1 block text-[11px] text-violet-600">
              admin@sehatku.id · admin123
            </span>
          </span>
          <span className="text-[10px] font-bold text-violet-600">ISI OTOMATIS</span>
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/" className="font-bold text-primary-600">
            ← Kembali ke toko
          </Link>
        </p>
      </div>
    </div>
  );
}
