import { TrendingUp } from "lucide-react";

interface AuthBrandHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthBrandHeader({ title, subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center justify-center w-14 h-14 bg-[#313235] rounded-2xl shadow-md">
        <TrendingUp size={28} className="text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
        <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
