import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, DollarSign, Scissors, User, Sparkles, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNailPro } from "@/lib/useNailPro";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/servicos", icon: Scissors, label: "Serviços" },
  { path: "/clientes", icon: Users, label: "Clientes" },
  { path: "/financeiro", icon: DollarSign, label: "Financeiro" },
];

const mobileNavItems = [
  { path: "/", icon: LayoutDashboard, label: "Início" },
  { path: "/agenda", icon: Calendar, label: "Agenda" },
  { path: "/clientes", icon: Users, label: "Clientes" },
  { path: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

export default function AppLayout() {
  const location = useLocation();
  const { nailPro } = useNailPro();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-card border-b border-border sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">NailFlow</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/planos" className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all", location.pathname === "/planos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            <CreditCard className="w-4 h-4" /> Planos
          </Link>
          <Link to="/perfil" className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all", location.pathname === "/perfil" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
            <User className="w-4 h-4" />
            {nailPro?.owner_name?.split(" ")[0] || "Perfil"}
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-heading text-base font-bold text-foreground">NailFlow</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/servicos" className={cn("p-2 rounded-lg transition-colors", location.pathname === "/servicos" ? "text-primary" : "text-muted-foreground hover:bg-accent")}>
            <Scissors className="w-5 h-5" />
          </Link>
          <Link to="/planos" className={cn("p-2 rounded-lg transition-colors", location.pathname === "/planos" ? "text-primary" : "text-muted-foreground hover:bg-accent")}>
            <CreditCard className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn("flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all min-w-[52px]", isActive ? "text-primary" : "text-muted-foreground")}
              >
                <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}