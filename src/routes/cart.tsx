import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerHeader } from "@/components/customer-header";
import { useCart, useHydrated } from "@/lib/cart";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Keranjang — MAJAMU" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, updateQty, remove, ctx } = useCart();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return (
    <div className="min-h-screen bg-background pb-32">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Keranjang</h1>
        {items.length === 0 ? (
          <div className="mt-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Keranjang masih kosong.</p>
            <Button asChild className="mt-4"><Link to="/menu">Lihat Menu</Link></Button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-3 rounded-2xl bg-card p-3 shadow-soft">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">🌿</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold leading-tight">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.customization.temperature ?? ""} {it.customization.sweetness ? `· ${it.customization.sweetness}` : ""}{it.customization.creamy ? " · Creamy" : ""}
                    </div>
                    <div className="mt-1 font-bold text-primary">{rupiah(it.price * it.quantity)}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => remove(idx)} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                      <button onClick={() => updateQty(idx, it.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-card"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-5 text-center text-sm font-bold">{it.quantity}</span>
                      <button onClick={() => updateQty(idx, it.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-card"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{ctx.tableCode ? (ctx.orderType === "DINE_IN" ? `Meja ${ctx.tableCode}` : "Take Away") : "Belum pilih meja"}</span>
                <span>{items.reduce((s, i) => s + i.quantity, 0)} item</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="text-xl font-extrabold text-primary">{rupiah(subtotal)}</span>
              </div>
            </div>
          </>
        )}
      </main>
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <Button asChild size="lg" className="w-full"><Link to="/checkout">Lanjut ke Checkout</Link></Button>
          </div>
        </div>
      )}
    </div>
  );
}
