"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

function getFormattedDate() {
  return new Intl.DateTimeFormat("en-US", {
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
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10 hover:text-white"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </Button>
      </div>
    </header>
  );
}
