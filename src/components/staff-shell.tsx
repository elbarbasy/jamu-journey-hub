import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/majamu-logo.png.asset.json";

export function StaffShell({ children, title }: { children: React.ReactNode; title: string }) {
  const nav = useNavigate();
  const { isOwner, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="MAJAMU" width={120} height={32} className="h-11 w-auto object-contain" />
            <span className="text-[10px] uppercase tracking-widest opacity-70">{isOwner ? "Owner" : "Cashier"}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs opacity-80 sm:inline">{user?.email}</span>
            <Button size="sm" variant="ghost" className="hover:bg-sidebar-accent" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-5 text-2xl font-extrabold tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
}
