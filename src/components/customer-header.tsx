import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf, ShoppingBag } from "lucide-react";
import { useCart, useHydrated } from "@/lib/cart";

export function CustomerHeader() {
  const { count } = useCart();
  const hydrated = useHydrated();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const showCart = !path.startsWith("/cart") && !path.startsWith("/checkout") && !path.startsWith("/auth") && !path.startsWith("/owner") && !path.startsWith("/cashier");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm shadow-warm">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">MAJAMU</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tradisi yang Dimajukan</div>
          </div>
        </Link>
        {showCart && (
          <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
            <ShoppingBag className="h-5 w-5" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
                {count}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
