import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata: Metadata = { title: { default: "Painel", template: "%s | Painel Gilson Parrilha" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
