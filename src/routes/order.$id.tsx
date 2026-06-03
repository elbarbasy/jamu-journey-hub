import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { supabase } from "@/integrations/supabase/client";
import { rupiah, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { buildReceipt, waLink } from "@/lib/whatsapp";
import { Check, Clock, CookingPot, PackageCheck, QrCode, Smartphone } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Item = Database["public"]["Tables"]["order_items"]["Row"];

const STATUS_STEPS = ["WAITING_PAYMENT", "PAID", "PROCESSING", "READY_FOR_PICKUP", "COMPLETED"] as const;
const STATUS_LABEL: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Pembayaran Diterima",
  PROCESSING: "Sedang Disiapkan",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "Status Pesanan — MAJAMU" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      setOrder((o as Order | null) ?? null);
      const { data: its } = await supabase.from("order_items").select("*").eq("order_id", id);
      setItems((its as Item[] | null) ?? []);
    };
    load();
    const ch = supabase.channel("order-" + id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (p) => setOrder(p.new as Order))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (order === undefined) return <div className="p-8 text-center text-muted-foreground">Memuat…</div>;
  if (order === null) return <div className="p-8 text-center">Pesanan tidak ditemukan.</div>;

  const idx = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const isCancelled = order.status === "CANCELLED";

  const receipt = buildReceipt({
    order_number: order.order_number,
    customer_name: order.customer_name,
    customer_whatsapp: order.customer_whatsapp,
    order_type: order.order_type as "DINE_IN" | "TAKE_AWAY",
    table_code: order.table_code,
    payment_method: order.payment_method as "QRIS" | "CASH",
    total: order.total,
    items: items.map((i) => ({ product_name: i.product_name, quantity: i.quantity, line_total: i.line_total })),
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <div className="rounded-2xl bg-gradient-warm p-5 text-primary-foreground shadow-warm">
          <div className="text-xs uppercase tracking-widest opacity-80">No. Pesanan</div>
          <div className="text-3xl font-extrabold">{order.order_number}</div>
          <div className="mt-1 text-sm opacity-90">{formatDateTime(order.created_at)} · {order.order_type === "DINE_IN" ? `Meja ${order.table_code}` : "Take Away"}</div>
        </div>

        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary">Status</div>
          {isCancelled ? (
            <div className="mt-3 rounded-xl bg-destructive/10 p-3 font-bold text-destructive">Pesanan Dibatalkan</div>
          ) : (
            <ol className="mt-3 space-y-3">
              {STATUS_STEPS.map((s, i) => {
                const done = i <= idx;
                const active = i === idx;
                const icons = [Smartphone, Check, CookingPot, PackageCheck, Check];
                const Icon = icons[i];
                return (
                  <li key={s} className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition ${done ? "bg-gradient-warm text-primary-foreground shadow-warm" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Icon className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className={`text-sm ${active ? "font-bold" : done ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABEL[s]}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {order.status === "WAITING_PAYMENT" && order.payment_method === "QRIS" && (
          <section className="mt-4 rounded-2xl bg-card p-5 text-center shadow-soft">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary">Bayar dengan QRIS</div>
            <div className="mx-auto mt-3 flex h-44 w-44 items-center justify-center rounded-2xl bg-foreground/5 p-3">
              {/* Mock QRIS — replace with Midtrans generated payload */}
              <img alt="QRIS demo" src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("MAJAMU/" + order.order_number + "/" + order.total)}`} className="h-full w-full" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-primary">{rupiah(order.total)}</p>
            <p className="text-xs text-muted-foreground">Scan QR ini di aplikasi bank/e-wallet kamu. Kasir akan memverifikasi pembayaran.</p>
          </section>
        )}
        {order.status === "WAITING_PAYMENT" && order.payment_method === "CASH" && (
          <section className="mt-4 rounded-2xl bg-card p-5 text-center shadow-soft">
            <QrCode className="mx-auto h-10 w-10 text-secondary" />
            <p className="mt-2 font-semibold">Silakan bayar di kasir</p>
            <p className="text-2xl font-extrabold text-primary">{rupiah(order.total)}</p>
          </section>
        )}

        <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary">Pesanan</div>
          <div className="mt-2 space-y-1.5 text-sm">
            {items.map((i) => <div key={i.id} className="flex justify-between"><span>{i.quantity}× {i.product_name}</span><span>{rupiah(i.line_total)}</span></div>)}
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3"><span className="font-semibold">Total</span><span className="text-xl font-extrabold text-primary">{rupiah(order.total)}</span></div>
        </section>

        <a href={waLink(order.customer_whatsapp, receipt)} target="_blank" rel="noreferrer" className="mt-4 block">
          <Button variant="outline" className="w-full">Kirim Ulang Struk via WhatsApp</Button>
        </a>
        <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/menu">Pesan Lagi</Link></Button>
      </main>
    </div>
  );
}
