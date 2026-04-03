import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordFieldProps {
  id: string;
  label: string;
  /** Renders on the same row as the label (e.g. “Esqueceu a senha?”). */
  labelRight?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
  placeholder?: string;
}

export function PasswordField({
  id,
  label,
  labelRight,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  placeholder = "••••••••",
}: PasswordFieldProps) {
  const labelRow = labelRight ? (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      {labelRight}
    </div>
  ) : (
    <label htmlFor={id} className="text-sm font-medium text-white/80">
      {label}
    </label>
  );

  return (
    <div className="space-y-1.5">
      {labelRow}
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="h-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          tabIndex={-1}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
