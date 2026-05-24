import { Link } from "react-router-dom";
import { LogOut, Menu, Search, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants";

export function Navbar() {
  const { toggleSidebar } = useApp();
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden w-72 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products, SKUs, alerts..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.PROFILE}
          className="hidden items-center gap-2 rounded-lg px-2 py-1 text-right transition-colors hover:bg-accent sm:flex"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-9 w-9 rounded-full border border-border object-cover"
            />
          ) : (
            <UserCircle className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">{user?.name || "Seller"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </Link>
        <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
