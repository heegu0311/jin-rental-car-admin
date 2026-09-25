import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}
export function EmptyState({
  title = "등록된 내용이 없습니다.",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function Feedback({
  message,
  tone = "error",
}: {
  message?: string | null;
  tone?: "error" | "success" | "info";
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border p-4 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-blue-200 bg-blue-50 text-blue-800",
      )}
    >
      {message}
    </p>
  );
}
export function StatusBadge({
  children,
  tone = "pending",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold",
        ["answered", "confirmed", "available", "published"].includes(tone)
          ? "bg-emerald-50 text-emerald-700"
          : ["cancelled", "maintenance"].includes(tone)
            ? "bg-red-50 text-red-700"
            : "bg-blue-50 text-blue-700",
      )}
    >
      {children}
    </span>
  );
}
