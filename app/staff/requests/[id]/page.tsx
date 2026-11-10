import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile || profile.role !== "staff") redirect("/");
  const { data: request, error } = await db.from("reservations")
    .select("id,car_name,start_date,period,package_km,options,user_name,user_phone,status,created_at")
    .eq("id", id).maybeSingle();
  if (error) throw new Error("예약 요청을 불러오지 못했습니다.");
  if (!request) notFound();
  const noteResult = await db.from("reservations").select("staff_request_note").eq("id", id).maybeSingle();
  if (noteResult.error && noteResult.error.code !== "42703" && noteResult.error.code !== "PGRST204")
    throw new Error("담당자 처리 요청 사항을 불러오지 못했습니다.");
  const staffRequestNote = noteResult.data?.staff_request_note || "";

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><article className="mx-auto max-w-3xl space-y-5">
    <div className="flex items-center justify-between gap-3"><Link href="/staff/requests" className="text-sm font-semibold text-blue-700 underline">← 목록</Link><a href={`/staff/requests/${id}`} className="text-sm font-semibold text-blue-700 underline">새로고침</a></div>
    <header><h1 className="text-2xl font-bold">예약 처리 요청 상세</h1><p className="mt-1 text-sm text-slate-600">상담완료는 배차 확정을 뜻하지 않습니다.</p></header>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">{request.car_name}</h2><span className="text-sm text-blue-700">{request.status === "pending" ? "상담 대기" : request.status === "confirmed" ? "상담완료" : "취소"}</span></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-medium text-slate-600">대여 시작</dt><dd>{request.start_date}</dd></div><div><dt className="font-medium text-slate-600">기간</dt><dd>{request.period}</dd></div><div><dt className="font-medium text-slate-600">주행거리</dt><dd>{request.package_km}</dd></div><div><dt className="font-medium text-slate-600">고객 연락처</dt><dd>{request.user_name} · <a className="text-blue-700 underline" href={`tel:${request.user_phone.replace(/[^\d+]/g, "")}`}>{request.user_phone}</a></dd></div></dl>
      {request.options?.length ? <div className="mt-4 text-sm"><h3 className="font-medium">선택 사항 및 고객 요청</h3><ul className="mt-2 list-disc pl-5">{(request.options as string[]).map((option: string, index: number) => <li key={index}>{option}</li>)}</ul></div> : null}
    </section>
    <section className="rounded-xl border border-blue-100 bg-blue-50 p-5"><h2 className="font-semibold text-blue-900">담당자 처리 요청 사항 (관리자)</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{staffRequestNote || "등록된 요청 사항이 없습니다."}</p></section>
  </article></main>;
}
