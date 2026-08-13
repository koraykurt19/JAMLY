import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-jam-blue text-white hover:bg-jam-blue/88 disabled:bg-jam-blue/40 disabled:text-white/60",
  secondary:
    "border border-white/12 bg-white/[0.06] text-white hover:bg-white/12 disabled:text-white/40",
  ghost: "text-content-secondary hover:bg-white/[0.06] hover:text-white",
  danger:
    "bg-jam-danger/16 text-jam-danger border border-jam-danger/32 hover:bg-jam-danger/24",
  subtle: "bg-jam-raised text-white hover:bg-jam-hover border border-white/8"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-control-sm px-3 text-[13px] gap-1.5",
  md: "min-h-control px-4 text-sm gap-2",
  lg: "min-h-control-lg px-5 text-[15px] gap-2"
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, fullWidth, className, children, disabled, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "focus-ring inline-flex items-center justify-center rounded-md font-semibold transition",
        "disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="animate-spin" size={16} /> : null}
      {children}
    </button>
  );
});
