import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

/** Layout pasien: sticky header + konten + bottom navigation */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      {/* pb-nav memberi ruang agar konten tidak tertutup bottom navigation */}
      <main id="konten" className="pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
