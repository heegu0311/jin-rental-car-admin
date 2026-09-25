import { Check } from "lucide-react";

const chipColors = {
  slate: {
    idle: "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400",
    selected:
      "border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-300",
  },
  blue: {
    idle: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400",
    selected: "border-blue-600 bg-blue-100 text-blue-900 ring-2 ring-blue-300",
  },
  emerald: {
    idle: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400",
    selected:
      "border-emerald-600 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-300",
  },
  red: {
    idle: "border-red-200 bg-red-50 text-red-700 hover:border-red-400",
    selected: "border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300",
  },
  indigo: {
    idle: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400",
    selected:
      "border-indigo-600 bg-indigo-100 text-indigo-900 ring-2 ring-indigo-300",
  },
  sky: {
    idle: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400",
    selected: "border-sky-600 bg-sky-100 text-sky-900 ring-2 ring-sky-300",
  },
  violet: {
    idle: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400",
    selected:
      "border-violet-600 bg-violet-100 text-violet-900 ring-2 ring-violet-300",
  },
} as const;

function chipColor(value: string, group: "status" | "type") {
  if (value === "all") return chipColors.slate;
  if (group === "type") {
    if (value === "rental") return chipColors.indigo;
    if (value === "new-car") return chipColors.sky;
    return chipColors.violet;
  }
  if (value === "confirmed" || value === "answered") return chipColors.emerald;
  if (value === "cancelled") return chipColors.red;
  return chipColors.blue;
}

export function StatusChips({
  label,
  value,
  options,
  onChange,
  disabled = false,
  group = "status",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  group?: "status" | "type";
}) {
  return (
    <fieldset className="min-w-0 w-full space-y-2">
      <legend className="text-sm font-bold text-slate-700">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${value === option.value ? chipColor(option.value, group).selected : chipColor(option.value, group).idle}`}
          >
            {value === option.value && (
              <Check size={14} className="mr-1 inline" aria-hidden="true" />
            )}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
