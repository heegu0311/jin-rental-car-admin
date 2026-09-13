import type { ReactNode } from 'react';
import { EmptyState } from './feedback';
export interface Column<T> { key:string; label:string; render:(row:T)=>ReactNode; }
export function DataTable<T extends {id:string}>({rows,columns,caption}:{rows:T[];columns:Column<T>[];caption:string}) {
 if(!rows.length)return <EmptyState/>;
 return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><caption className="sr-only">{caption}</caption><thead className="bg-slate-50 text-xs text-slate-500"><tr>{columns.map(c=><th key={c.key} scope="col" className="whitespace-nowrap px-5 py-4 font-semibold">{c.label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(row=><tr key={row.id} className="hover:bg-slate-50/70">{columns.map(c=><td key={c.key} className="px-5 py-4">{c.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
