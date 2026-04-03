import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-full min-h-screen w-full">
      <Sidebar />
      {/* Sibling of peer/sidebar so md:peer-hover/sidebar works (Tailwind peer is sibling-only). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 hidden bg-black/20 opacity-0 transition-opacity duration-300 md:block md:left-16 md:peer-hover/sidebar:opacity-100"
      />
      <div className="relative z-0 flex min-h-screen min-w-0 flex-col overflow-auto md:pl-16">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
