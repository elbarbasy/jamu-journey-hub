import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { useCart, useHydrated } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupiah } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { QrCode, Banknote } from "lucide-react";

const schema = z.object({
  customer_name: z.string().trim().min(1, "Nama wajib").max(100),
  customer_whatsapp: z.string().trim().regex(/^[0-9+\s-]{6,20}$/, "Nomor WhatsApp tidak valid"),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — MAJAMU" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const hydrated = useHydrated();
  const { items, subtotal, ctx, clear } = useCart();
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [method, setMethod] = useState<"QRIS" | "CASH">("QRIS");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (!hydrated) return null;
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background"><CustomerHeader />
        <div className="p-8 text-center text-muted-foreground">Keranjang kosong.</div>
      </div>
    );
  }

  const onPlace = async () => {
    const parsed = schema.safeParse({ customer_name: name, customer_whatsapp: wa });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    const orderType = ctx.orderType ?? "TAKE_AWAY";
    const { data: order, error } = await supabase.from("orders").insert({
      customer_name: parsed.data.customer_name,
      customer_whatsapp: parsed.data.customer_whatsapp,
      order_type: orderType,
      table_code: ctx.tableCode,
      payment_method: method,
      status: "WAITING_PAYMENT",
      subtotal,
      total: subtotal,
    }).select("id, order_number").single();

    if (error || !order) {
      setBusy(false);
      toast.error("Gagal membuat pesanan: " + (error?.message ?? "unknown"));
      return;
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
      customization: i.customization,
      line_total: i.price * i.quantity,
    })));
    if (itemsErr) { setBusy(false); toast.error("Gagal menyimpan item: " + itemsErr.message); return; }

    await supabase.from("payments").insert({ order_id: order.id, method, amount: subtotal, status: "PENDING" });

    clear();
    nav({ to: "/order/$id", params: { id: order.id } });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Checkout</h1>

        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary">Informasi Pemesan</div>
          <div className="mt-3 grid gap-3">
            <div>
              <Label htmlFor="n">Nama Lengkap</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="w">Nomor WhatsApp</Label>
              <Input id="w" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812xxxxxxx" maxLength={20} inputMode="tel" />
              <p className="mt-1 text-[11px] text-muted-foreground">Struk akan dikirim ke nomor ini.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary">Metode Pembayaran</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PayBtn active={method === "QRIS"} onClick={() => setMethod("QRIS")} icon={<QrCode className="h-5 w-5" />} label="QRIS" />
            <PayBtn active={method === "CASH"} onClick={() => setMethod("CASH")} icon={<Banknote className="h-5 w-5" />} label="Tunai (Kasir)" />
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary">Ringkasan</div>
          <div className="mt-2 text-sm text-muted-foreground">{ctx.tableCode ? (ctx.orderType === "DINE_IN" ? `Meja ${ctx.tableCode}` : "Take Away") : "Take Away"}</div>
          <div className="mt-3 space-y-1.5 text-sm">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between"><span>{i.quantity}× {i.name}</span><span>{rupiah(i.price * i.quantity)}</span></div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-extrabold text-primary">{rupiah(subtotal)}</span>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <Button onClick={onPlace} disabled={busy} className="w-full" size="lg">{busy ? "Memproses…" : `Buat Pesanan · ${rupiah(subtotal)}`}</Button>
        </div>
      </div>
    </div>
  );
}

function PayBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-2xl border-2 p-4 text-left font-semibold transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
      {icon}{label}
    </button>
  );
}
