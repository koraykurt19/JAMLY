import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error wrapper. Errors are announced politely. */
export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-white/82">
        {label}
        {required ? <span className="ml-1 text-jam-coral">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] leading-5 text-jam-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-5 text-content-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function TextInput({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn("input-field", className)}
        {...rest}
      />
    );
  }
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn("input-field resize-y py-3 leading-6", className)}
      {...rest}
    />
  );
});

export const NativeSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function NativeSelect({ className, invalid, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn("input-field appearance-none pr-9", className)}
      {...rest}
    >
      {children}
    </select>
  );
});

/** Checkbox with an inline label, sized for touch. */
export function CheckboxField({
  label,
  checked,
  onChange,
  name,
  error
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  name?: string;
  error?: string | null;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 py-1 text-[13px] leading-6 text-white/72">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          className="focus-ring mt-0.5 size-[18px] shrink-0 rounded border border-white/24 bg-black/40 accent-jam-blue"
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p role="alert" className="pl-[30px] text-[13px] text-jam-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
