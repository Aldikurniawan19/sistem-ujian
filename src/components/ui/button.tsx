import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "warning";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0F4C5C] text-white border border-[#0F4C5C] hover:bg-[#0A3844] disabled:bg-[#0F4C5C]/50",
  secondary:
    "bg-[#F1F1ED] text-[#141413] border border-[#E5E5E0] hover:bg-[#E5E5E0]",
  outline:
    "bg-white text-[#141413] border border-[#D4D4CC] hover:bg-[#F7F7F5]",
  ghost:
    "bg-transparent text-[#575652] border border-transparent hover:bg-[#F1F1ED] hover:text-[#141413]",
  danger:
    "bg-[#B91C1C] text-white border border-[#B91C1C] hover:bg-[#991B1B] disabled:bg-[#B91C1C]/50",
  warning:
    "bg-[#FEF3C7] text-[#78350F] border border-[#F59E0B] hover:bg-[#FDE68A]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
