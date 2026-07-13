"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/format";

export type UiSelectOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type UiSelectProps<T extends string> = {
  value: T;
  options: UiSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  placeholder?: string;
  variant?: "field" | "pill" | "ghost";
  className?: string;
  restoreFocusOnSelect?: boolean;
};

export function UiSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  variant = "field",
  className,
  restoreFocusOnSelect = true
}: UiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const label = selectedOption?.label || placeholder || ariaLabel;

  useEffect(() => {
    if (!open) return;

    function closeOnPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectOption(option: UiSelectOption<T>) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    if (restoreFocusOnSelect) {
      buttonRef.current?.focus();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative isolate", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "focus-ring group flex w-full items-center justify-between gap-3 border text-left text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition",
          variant === "field" &&
            "min-h-12 rounded-lg border-white/10 bg-black/35 px-4 text-white hover:border-jam-blue/35 hover:bg-jam-blue/5",
          variant === "pill" &&
            "h-12 rounded-full border-white/10 bg-black/35 px-4 text-white/76 hover:border-jam-blue/35 hover:bg-jam-blue/5 hover:text-white",
          variant === "ghost" &&
            "h-12 rounded-full border-transparent bg-transparent px-1 text-white/76 hover:text-white"
        )}
      >
        <span className={cn("min-w-0 truncate", !selectedOption && "text-white/38")}>
          {label}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-white/42 transition duration-200 group-hover:text-jam-blue",
            open && "rotate-180 text-jam-blue"
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[999] max-h-72 min-w-48 overflow-y-auto overscroll-contain rounded-lg border border-jam-blue/25 bg-[#101722] p-1.5 shadow-[0_28px_90px_rgba(0,0,0,0.78),0_0_0_1px_rgba(255,255,255,0.06)_inset] ring-1 ring-black/40"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                onClick={() => selectOption(option)}
                className={cn(
                  "focus-ring flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-gradient-to-r from-jam-blue to-[#79a8ff] text-black shadow-[0_8px_24px_rgba(88,197,255,0.24)]"
                    : "bg-[#0b1018] text-white/72 hover:bg-[#172132] hover:text-white",
                  option.disabled && "cursor-not-allowed opacity-45"
                )}
              >
                <span className="min-w-0 truncate font-semibold">{option.label}</span>
                {active ? <Check size={15} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
