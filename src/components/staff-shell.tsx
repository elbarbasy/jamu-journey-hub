import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Leaf, LogOut, LayoutDashboard, ShoppingBag, Package, HelpCircle, QrCode, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function StaffShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isOwner, isCashier, user } = useAuth();

  const items = isOwner
    ? [
        { to: "/owner", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/owner/orders", icon: ShoppingBag, label: "Pesanan" },
        { to: "/owner/products", icon: Package, label: "Produk" },
        { to: "/owner/quiz", icon: HelpCircle, label: "Kuis" },
        { to: "/owner/tables", icon: QrCode, label: "QR Meja" },
        { to: "/owner/staff", icon: Users, label: "Staff" },
      ]
    : [{ to: "/cashier", icon: ShoppingBag, label: "Antrian Pesanan" }];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold leading-tight">MAJAMU</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">{isOwner ? "Owner" : "Cashier"}</div>
          </div>
        </Link>
        <nav className="mt-6 flex-1 space-y-1">
          {items.map((it) => {
            const active = path === it.to || (it.to !== "/owner" && it.to !== "/cashier" && path.startsWith(it.to));
            return (
              <Link key={it.to} to={it.to} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
                <it.icon className="h-4 w-4" />{it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 truncate text-xs opacity-70">{user?.email}</div>
        <Button variant="ghost" className="mt-2 justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </aside>

      {/* mobile top bar */}
      <div className="flex w-full flex-col">
        <header className="flex items-center justify-between border-b bg-sidebar p-3 text-sidebar-foreground md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-warm"><Leaf className="h-4 w-4 text-primary-foreground" /></div>
            <span className="font-bold">MAJAMU {isOwner ? "Owner" : "Cashier"}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}><LogOut className="h-4 w-4" /></Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-card p-2 md:hidden">
          {items.map((it) => {
            const active = path === it.to;
            return (
              <Link key={it.to} to={it.to} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
