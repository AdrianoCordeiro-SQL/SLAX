"use client";

import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-background shrink-0">
      <p className="text-sm text-muted-foreground">{getFormattedDate()}</p>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Admin" />
            <AvatarFallback className="bg-[#1e2d5a] text-white text-xs font-bold">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
