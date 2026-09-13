import { requireAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/admin/DashboardShell";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <DashboardShell>{children}</DashboardShell>;
}
