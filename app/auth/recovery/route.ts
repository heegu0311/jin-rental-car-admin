import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const failure = () =>
    NextResponse.redirect(
      new URL("/login/forgot-password?error=invalid_link", url.origin),
    );
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.has("error")) return failure();
  try {
    const db = await createClient();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (error || !data.user) return failure();
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (
      profileError ||
      !profile ||
      !["admin", "superadmin"].includes(profile.role)
    ) {
      await db.auth.signOut();
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", url.origin),
      );
    }
    const response = NextResponse.redirect(
      new URL("/login/reset-password", url.origin),
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return failure();
  }
}
