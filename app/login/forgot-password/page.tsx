import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <PasswordRecoveryForm
      mode="request"
      invalidLink={error === "invalid_link"}
    />
  );
}
