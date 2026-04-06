"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileBarChart2,
  Users,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import { useAccount } from "@/hooks/useAccount";
import { logout } from "@/lib/api/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Visão geral", href: "/", icon: LayoutDashboard },
  { label: "Relatórios", href: "/reports", icon: FileBarChart2 },
  { label: "Clientes", href: "/users", icon: Users },
  { label: "Alertas", href: "/alerts", icon: Bell },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: account } = useAccount();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around bg-[#313235] border-t border-white/10 h-16 md:hidden">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors",
              active ? "text-white" : "text-blue-200 hover:text-white",
            )}
            aria-label={label}
          >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}

      <Link
        href="/profile"
        className={cn(
          "flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium transition-colors",
          pathname === "/profile"
            ? "text-white"
            : "text-blue-200 hover:text-white",
        )}
        aria-label="Perfil"
      >
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={account?.avatar_url ?? ""}
            alt={account?.name ?? ""}
          />
          <AvatarFallback className="bg-white/15 text-white text-[9px] font-bold">
            {account ? getInitials(account.name) : "…"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px]">Perfil</span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-medium text-blue-200 hover:text-white transition-colors"
        aria-label="Sair"
      >
        <LogOut size={20} />
        <span className="text-[10px]">Sair</span>
      </button>
    </nav>
  );
}
