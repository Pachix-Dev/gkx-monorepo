"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

// ── helpers ─────────────────────────────────────────────────────────────────

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

/** "2026-03-20" */
export function formatDateYMD(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`;
}

/** Pretty label: "20 mar 2026" */
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── DatePickerInput ──────────────────────────────────────────────────────────

interface DatePickerInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CalendarIcon />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-border bg-card shadow-lg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(day) => {
              onChange(day);
              setOpen(false);
            }}
            classNames={dayPickerClassNames}
            modifiersClassNames={{
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "font-bold text-primary",
              outside: "opacity-40",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── DateTimePickerInput ──────────────────────────────────────────────────────

interface DateTimePickerInputProps {
  dateValue: Date | undefined;
  timeValue: string; // "HH:mm"
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

export function DateTimePickerInput({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
}: DateTimePickerInputProps) {
  const timeInputRef = useRef<HTMLInputElement>(null);

  const openTimePicker = () => {
    if (disabled) return;

    const input = timeInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;

    input.focus();
    input.showPicker?.();
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <DatePickerInput
          value={dateValue}
          onChange={onDateChange}
          placeholder="Fecha"
          disabled={disabled}
        />
      </div>
      <div className="relative w-32" onClick={openTimePicker}>
        <input
          ref={timeInputRef}
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={disabled}
          aria-label="Seleccionar hora"
          className="w-full cursor-pointer rounded-md border border-border bg-background py-2 pl-1 pr-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <ClockIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

// ── Inline icons ─────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-muted-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ── DayPicker classNames (Tailwind) ───────────────────────────────────────────

const dayPickerClassNames = {
  root: "p-3 select-none",
  months: "flex flex-col gap-4",
  month: "flex flex-col gap-3",
  month_caption: "flex items-center justify-between px-1",
  caption_label: "text-sm font-semibold text-foreground",
  nav: "flex items-center gap-1",
  button_previous:
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted",
  button_next:
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday:
    "flex h-8 w-8 items-center justify-center text-xs font-normal text-muted-foreground",
  week: "flex mt-1",
  day: "p-0",
  day_button:
    "h-8 w-8 rounded-md text-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40",
  hidden: "invisible",
  range_start: "",
  range_end: "",
  range_middle: "",
  focused: "ring-2 ring-primary/40",
};
