"use client";
import { Feedback } from '@/components/shared/feedback';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="space-y-5"><h1 className="text-2xl font-bold">데이터를 불러오지 못했습니다</h1><Feedback message="연결 상태를 확인하고 다시 시도해주세요."/><button onClick={reset} className="rounded-lg bg-blue-600 px-5 py-3 text-white">다시 시도</button></div>}
