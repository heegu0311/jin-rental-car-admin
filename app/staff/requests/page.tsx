import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";
const filters = [
  { value: "all", label: "전체" },
  { value: "pending", label: "상담 대기" },
  { value: "confirmed", label: "상담완료" },
  { value: "cancelled", label: "취소" },
] as const;

export default async function StaffRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requestedStatus } = await searchParams;
  const status = filters.some((filter) => filter.value === requestedStatus) ? requestedStatus : "all";
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile || profile.role !== "staff") redirect("/");

  let query = db.from("reservations")
    .select("id,car_name,start_date,user_name,status,created_at")
    .eq("assigned_staff_id", user.id)
    .order("created_at", { ascending: false }).limit(100);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error("예약 요청을 불러오지 못했습니다.");

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">예약 처리 요청</h1><p className="mt-1 text-sm text-slate-600">담당자로 지정된 상담건입니다. 상담완료는 배차 확정을 뜻하지 않습니다.</p></div>
        <form action={logout}><button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">로그아웃</button></form>
      </header>
      <nav aria-label="처리 상태 필터" className="flex flex-wrap gap-2">
        {filters.map((filter) => <Link key={filter.value} href={filter.value === "all" ? "/staff/requests" : `/staff/requests?status=${filter.value}`} aria-current={status === filter.value ? "page" : undefined} className={`rounded-lg px-4 py-2 text-sm font-semibold ${status === filter.value ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{filter.label}</Link>)}
      </nav>
      <div className="flex items-center justify-between"><p className="text-sm text-slate-600">{data?.length || 0}건 표시</p><a href={status === "all" ? "/staff/requests" : `/staff/requests?status=${status}`} className="text-sm font-semibold text-blue-700 underline">새로고침</a></div>
      {data?.length ? <ul className="space-y-3">{data.map((request) => <li key={request.id}>
        <Link href={`/staff/requests/${request.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-700">
          <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{request.car_name}</h2><span className="text-sm text-blue-700">{filters.find((filter) => filter.value === request.status)?.label || request.status}</span></div>
          <p className="mt-3 text-sm text-slate-600">{request.user_name} · 대여 시작 {request.start_date}</p>
          <p className="mt-2 text-sm font-semibold text-blue-700">상세 보기 →</p>
        </Link>
      </li>)}</ul> : <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm">해당 상태의 요청이 없습니다.</p>}
    </div>
  </main>;
}
