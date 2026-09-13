import type { ReactNode } from 'react';
export function Panel({title,children,action}:{title:string;children:ReactNode;action?:ReactNode}) {return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-bold text-slate-900">{title}</h2>{action}</div>{children}</section>;}
