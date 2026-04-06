"use client";

import { AlertsNotificationBell } from "@/components/layout/AlertsNotificationBell";

function getFormattedDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Header() {
  return (
    <header className="h-17.5 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-[#313235] text-white shrink-0">
      <div className="flex items-center gap-3">
        <p className="text-sm text-white hidden sm:block">
          {getFormattedDate()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AlertsNotificationBell />
      </div>
    </header>
  );
}
