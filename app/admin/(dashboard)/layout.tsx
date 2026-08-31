import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/AdminShell";

/** Layout area admin (terguard) — login admin berada di luar grup ini */
export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
