import { useState, type ReactNode } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { AppSelect } from "@/components/ui/AppSelect";

export type WizardStep = {
  id: string;
  label: string;
};

export function WizardStepper({
  steps,
  currentStep,
}: {
  steps: WizardStep[];
  currentStep: number;
}) {
  const trackInset = "calc(100% / 6)";
  const trackWidth = "calc(100% * 2 / 3)";

  return (
    <div className="relative w-full">
      <div
        className="absolute top-4 h-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800"
        style={{ left: trackInset, right: trackInset }}
        aria-hidden
      />
      {currentStep > 1 && (
        <div
          className="absolute top-4 h-0.5 rounded-full bg-emerald-400 transition-all duration-300"
          style={{
            left: trackInset,
            width: `calc(${trackWidth} * ${(currentStep - 1) / (steps.length - 1)})`,
          }}
          aria-hidden
        />
      )}

      <div className="relative grid grid-cols-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-[var(--app-primary)] text-white"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {isComplete ? <CheckIcon className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={`max-w-full px-1 text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:text-[10px] sm:tracking-wider ${
                  isActive
                    ? "text-[var(--app-primary)]"
                    : isComplete
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WizardField({
  label,
  children,
  action,
  className = "",
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

export const wizardInputClass =
  "block w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all focus:border-[var(--app-primary)] focus:ring-1 focus:ring-[var(--app-primary)] dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100";

export const WIZARD_STEPS: WizardStep[] = [
  { id: "identity", label: "Identity" },
  { id: "job", label: "Job Details" },
  { id: "emergency", label: "Emergency Contact" },
];

export function WizardSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyMessage?: string;
}) {
  return (
    <WizardField label={label}>
      <AppSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        size="md"
      />
    </WizardField>
  );
}

export function WizardCreatableSelectField({
  label,
  value,
  onChange,
  options,
  onOptionsChange,
  placeholder,
  addPlaceholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onOptionsChange: (options: string[]) => void;
  placeholder?: string;
  addPlaceholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onOptionsChange(Array.from(new Set([...options, trimmed])));
    onChange(trimmed);
    setDraft("");
    setAdding(false);
  };

  return (
    <WizardField
      label={label}
      action={
        !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-primary)] hover:opacity-80"
          >
            + Add
          </button>
        ) : null
      }
    >
      <AppSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        size="md"
      />
      {adding && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            className={`${wizardInputClass} min-w-0 flex-1`}
            placeholder={addPlaceholder ?? `New ${label.toLowerCase()}`}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 rounded-xl bg-[var(--app-primary)] px-3 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
            className="shrink-0 rounded-xl border border-zinc-200 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      )}
    </WizardField>
  );
}
