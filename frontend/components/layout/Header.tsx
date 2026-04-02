"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { logout } from "@/lib/api/auth";

function getFormattedDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Header() {
  const toggle = useSidebarStore((s) => s.toggle);
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="h-17.5 px-4 md:px-6 flex items-center justify-between border-b border-white/10 bg-[#313235] text-white shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-white/10 hover:text-white"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </Button>
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

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Admin" />
            <AvatarFallback className="bg-white/15 text-white text-xs font-bold">
              AD
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-semibold text-white">Admin User</p>
            <p className="text-xs text-white">Administrator</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
