import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar className="hidden md:flex" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <Sidebar className="relative z-50" onNavigate={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
