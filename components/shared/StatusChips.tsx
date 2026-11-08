import { Check } from "lucide-react";

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
            className={`min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 ${value === option.value ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"}`}
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
