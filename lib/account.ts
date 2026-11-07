export type AccountIdentity = { email: string; name: string; initial: string };

export function accountIdentity(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AccountIdentity {
  const email = user.email ?? "";
  const metadata = user.user_metadata ?? {};
  const name = [metadata.display_name, metadata.full_name, metadata.name].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  return {
    email,
    name: name?.trim() ?? email.split("@")[0],
    initial: Array.from(email)[0]?.toUpperCase() ?? "?",
  };
}

export function validProfileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 &&
    name.length <= 40 &&
    !/[\u0000-\u001f\u007f]/.test(name)
    ? name
    : null;
}
