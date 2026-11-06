export function recoveryEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}

export function recoveryOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.origin !== value) return null;
    return url.protocol === "https:" || (url.protocol === "http:" && local)
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export function passwordRecoveryError(
  password: unknown,
  confirmation: unknown,
): string | null {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    return "비밀번호는 12~128자로 입력해 주세요.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "비밀번호에 영문과 숫자를 함께 사용해 주세요.";
  if (password !== confirmation) return "비밀번호 확인이 일치하지 않습니다.";
  return null;
}
