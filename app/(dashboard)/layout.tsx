import { requireAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/admin/DashboardShell";
import { accountIdentity } from "@/lib/account";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();
  return (
    <DashboardShell identity={accountIdentity(user)}>{children}</DashboardShell>
  );
}
