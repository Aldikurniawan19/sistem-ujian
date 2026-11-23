import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({
  className,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#E5E5E0] bg-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "border-b border-[#E5E5E0] px-5 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
