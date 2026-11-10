import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function StaffRequestsPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile || profile.role !== "staff") redirect("/");

  const { data, error } = await db.from("reservations")
    .select("id,car_name,start_date,period,package_km,options,user_name,user_phone,status,created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("예약 요청을 불러오지 못했습니다.");

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">예약 처리 요청</h1><p className="mt-1 text-sm text-slate-600">상담 접수 내역입니다. 상담완료는 배차 확정을 뜻하지 않습니다.</p></div>
        <div className="flex gap-2"><a href="/staff/requests" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">새로고침</a><form action={logout}><button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">로그아웃</button></form></div>
      </header>
      {data?.length ? <ul className="space-y-3">{data.map((request) => <li key={request.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{request.car_name}</h2><span className="text-sm text-blue-700">{request.status === "pending" ? "상담 대기" : request.status === "confirmed" ? "상담완료" : "취소"}</span></div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-medium">대여 시작</dt><dd>{request.start_date}</dd></div><div><dt className="font-medium">기간</dt><dd>{request.period}</dd></div><div><dt className="font-medium">주행거리</dt><dd>{request.package_km}</dd></div><div><dt className="font-medium">고객 연락처</dt><dd>{request.user_name} · <a className="text-blue-700 underline" href={`tel:${request.user_phone.replace(/[^\d+]/g, "")}`}>{request.user_phone}</a></dd></div></dl>
        {request.options?.length ? <div className="mt-3 text-sm"><h3 className="font-medium">선택 사항 및 요청</h3><ul className="mt-1 list-disc pl-5">{(request.options as string[]).map((option: string, index: number) => <li key={index}>{option}</li>)}</ul></div> : null}
      </li>)}</ul> : <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm">접수된 요청이 없습니다.</p>}
    </div>
  </main>;
}
