"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

/** Search bar besar di home — mengarah ke halaman katalog dengan query */
export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/obat?q=${encodeURIComponent(q)}` : "/obat");
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <Search
        size={18}
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari obat atau kebutuhan Anda"
        aria-label="Cari obat atau kebutuhan Anda"
        enterKeyHint="search"
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-slate-800 shadow-card placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
      />
    </form>
  );
}
