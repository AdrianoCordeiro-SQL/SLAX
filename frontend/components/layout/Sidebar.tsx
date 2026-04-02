"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart2,
  TrendingUp,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/useSidebarStore";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
  { label: "Users", href: "/users", icon: Users },
  { label: "API Logs", href: "/api-logs", icon: ScrollText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden animate-in fade-in duration-300"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-40 overflow-hidden bg-[#313235]",
          "transition-all duration-300 ease-in-out",
          "w-64 md:w-16 md:hover:w-64",
          "md:sticky md:top-0 md:z-auto md:translate-x-0 md:shrink-0 md:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full w-64 flex-col text-white">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0">
            <TrendingUp size={26} className="shrink-0 text-white" />
            <div className="flex flex-col leading-tight opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
              <span className="text-sm font-bold tracking-wide">SLAX</span>
              <span className="text-xs text-blue-300 font-medium uppercase tracking-widest">
                Analytics
              </span>
            </div>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors px-3 py-2.5",
                    active
                      ? "bg-white/15 text-white"
                      : "text-blue-200 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 px-5 py-3 border-t border-white/10">
            <span className="text-xs text-blue-300 whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
              SLAX
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
