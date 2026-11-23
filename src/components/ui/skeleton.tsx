import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-[#E5E5E0]", className)}
    />
  );
}

export function Kbd({ children }: { children: string }): React.JSX.Element {
  return (
    <kbd className="inline-flex h-5 items-center rounded border border-[#D4D4CC] bg-[#F7F7F5] px-1.5 font-mono text-[11px] font-medium text-[#575652]">
      {children}
    </kbd>
  );
}
