"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart2,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
  { label: "Users", href: "/users", icon: Users },
  { label: "API Logs", href: "/api-logs", icon: ScrollText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0 bg-[#1e2d5a] text-white">
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-xl font-bold tracking-wide">SLAX</span>
        <span className="ml-1 text-xs text-blue-300 font-medium uppercase tracking-widest">
          Analytics
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10 text-xs text-blue-300">
        v1.0.0 — SLAX MVP
      </div>
    </aside>
  );
}
