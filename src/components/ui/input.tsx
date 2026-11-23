import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const BASE_FIELD_CLASS =
  "w-full rounded-md border border-[#D4D4CC] bg-white px-3 py-2 text-sm text-[#141413] placeholder:text-[#787772] transition-colors focus:border-[#0F4C5C] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/20 disabled:cursor-not-allowed disabled:bg-[#F1F1ED] disabled:text-[#787772]";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputProps): React.JSX.Element {
  const errorId = error && id ? `${id}-error` : undefined;
  const hintId = hint && id ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#141413]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? hintId}
        className={cn(
          BASE_FIELD_CLASS,
          "h-10",
          error && "border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]/20",
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs text-[#575652]">
          {hint}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({
  label,
  error,
  hint,
  id,
  className,
  children,
  ...props
}: SelectProps): React.JSX.Element {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#141413]"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          BASE_FIELD_CLASS,
          "h-10",
          error && "border-[#B91C1C]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-[#575652]">{hint}</p>}
    </div>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: TextareaProps): React.JSX.Element {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#141413]"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          BASE_FIELD_CLASS,
          "min-h-[96px] resize-y",
          error && "border-[#B91C1C]",
          className
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-[#575652]">{hint}</p>}
    </div>
  );
}
