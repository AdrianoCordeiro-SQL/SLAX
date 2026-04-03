import { Loader2 } from "lucide-react";

export function AuthPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c1c1e] px-4">
      <Loader2 className="h-8 w-8 animate-spin text-white/40" />
    </div>
  );
}
