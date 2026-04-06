"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlertFirings } from "@/hooks/useAlerts";

const PREVIEW_COUNT = 8;

export function AlertsNotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, error } = useAlertFirings(1);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const el = containerRef.current;
      if (!el || el.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  const hasAlerts = Boolean(data && data.total > 0);
  const preview = data?.items.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative text-white hover:bg-white/10 hover:text-white"
        aria-label="Alertas recentes"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {hasAlerts && (
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500"
            aria-hidden
          />
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Alertas recentes"
          className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-white/10 bg-[#25262b] py-2 text-left text-sm text-white shadow-lg ring-1 ring-black/20"
        >
          <div className="border-b border-white/10 px-3 py-2 font-medium">Alertas recentes</div>
          <div className="px-3 py-2">
            {isLoading && (
              <p className="text-sm text-white/70">Carregando…</p>
            )}
            {isError && (
              <p className="text-sm text-red-300">
                {(error as Error)?.message ?? "Não foi possível carregar os alertas."}
              </p>
            )}
            {!isLoading && !isError && data && data.total === 0 && (
              <p className="text-sm text-white/80">Não há alertas recentes.</p>
            )}
            {!isLoading && !isError && hasAlerts && (
              <ul className="flex flex-col gap-2">
                {preview.map((f) => (
                  <li
                    key={f.id}
                    className="border-b border-white/5 pb-2 last:border-0 last:pb-0"
                  >
                    <p className="text-xs text-white/60">
                      {new Date(f.fired_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-0.5 leading-snug text-white/95">{f.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-white/10 px-3 py-2">
            <Link
              href="/alerts"
              className="text-sm font-medium text-blue-300 hover:text-blue-200 hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
