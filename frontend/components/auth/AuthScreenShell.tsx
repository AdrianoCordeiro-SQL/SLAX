import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthScreenShellProps {
  children: ReactNode;
  /** Extra classes on the outer full-screen wrapper (e.g. `py-8` on register). */
  className?: string;
}

export function AuthScreenShell({ children, className }: AuthScreenShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-[#1c1c1e] px-4",
        className,
      )}
    >
      <div className="w-full max-w-sm bg-[#232325] border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}
