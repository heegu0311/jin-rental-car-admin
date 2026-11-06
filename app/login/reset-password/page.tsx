import { requireAdmin } from "@/lib/auth";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";

export default async function ResetPasswordPage() {
  await requireAdmin();
  return <PasswordRecoveryForm mode="reset" />;
}
