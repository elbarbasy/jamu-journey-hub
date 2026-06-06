import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { rupiah, formatDateTime } from "@/lib/format";
import { buildReceipt } from "@/lib/whatsapp";
import { sendFonnteMessage } from "@/lib/fonnte.functions";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Check, X, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Item = Database["public"]["Tables"]["order_items"]["Row"];

const NEXT: Record<string, Order["status"] | null> = {
  WAITING_PAYMENT: "PAID",
  PAID: "PROCESSING",
  PROCESSING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};
const LABEL_NEXT: Record<string, string> = {
  WAITING_PAYMENT: "Tandai Sudah Bayar",
  PAID: "Mulai Proses",
  PROCESSING: "Siap Diambil",
  READY_FOR_PICKUP: "Selesai",
};

export const Route = createFileRoute("/_authenticated/cashier")({
  head: () => ({ meta: [{ title: "Cashier — MAJAMU" }] }),
  component: CashierPage,
});

function CashierPage() {
  const { isOwner, isCashier, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    // Owner murni (tanpa role kasir) diarahkan ke dashboard owner
    if (!loading && isOwner && !isCashier) nav({ to: "/owner" });
  }, [loading, isOwner, isCashier, nav]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsBy, setItemsBy] = useState<Record<string, Item[]>>({});
  const [q, setQ] = useState("");
  const sendFonnte = useServerFn(sendFonnteMessage);

  const load = async () => {
    const { data: os } = await supabase.from("orders").select("*").not("status", "in", "(COMPLETED,CANCELLED)").order("created_at");
    const list = (os as Order[] | null) ?? [];
    setOrders(list);
    if (list.length > 0) {
      const { data: its } = await supabase.from("order_items").select("*").in("order_id", list.map((o) => o.id));
      const map: Record<string, Item[]> = {};
      (its as Item[] | null)?.forEach((i) => { (map[i.order_id] ||= []).push(i); });
      setItemsBy(map);
    } else setItemsBy({});
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("cashier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const advance = async (o: Order) => {
    const next = NEXT[o.status];
    if (!next) return;
    const updates: { status: Order["status"]; updated_at: string } = { status: next, updated_at: new Date().toISOString() };
    const { data: updated, error } = await supabase.from("orders").update(updates).eq("id", o.id).select();
    if (error) return toast.error(error.message);
    if (!updated || updated.length === 0) {
      return toast.error("Gagal update status. Pastikan akun kamu punya role cashier/owner.");
    }
    // Optimistic local update biar UI langsung berubah tanpa nunggu realtime
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next, updated_at: updates.updated_at } : x)));

    if (next === "PAID") {
      await supabase.from("payments").update({ status: "SUCCESS" }).eq("order_id", o.id);
      // Kirim struk digital via Fonnte begitu pembayaran diterima
      const items = itemsBy[o.id] ?? [];
      const msg = buildReceipt({
        order_number: o.order_number, customer_name: o.customer_name, customer_whatsapp: o.customer_whatsapp,
        order_type: o.order_type as "DINE_IN" | "TAKE_AWAY", table_code: o.table_code,
        payment_method: o.payment_method as "QRIS" | "CASH", total: o.total,
        items: items.map((i) => ({ product_name: i.product_name, quantity: i.quantity, line_total: i.line_total })),
      });
      const res = await sendFonnte({ data: { target: o.customer_whatsapp, message: msg } });
      if (res.ok) toast.success("Struk dikirim ke WhatsApp customer");
      else toast.error(`Gagal kirim WA: ${res.error}`);
    }
    if (next === "COMPLETED") {
      const { data: l } = await supabase.from("loyalty_points").select("*").eq("whatsapp", o.customer_whatsapp).maybeSingle();
      if (l) await supabase.from("loyalty_points").update({ points: (l.points ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", l.id);
      else await supabase.from("loyalty_points").insert({ whatsapp: o.customer_whatsapp, points: 1 });
    }
    toast.success(`Status diperbarui: ${next}`);
  };

  const cancel = async (o: Order) => {
    if (!confirm(`Batalkan pesanan ${o.order_number}?`)) return;
    await supabase.from("orders").update({ status: "CANCELLED", updated_at: new Date().toISOString() }).eq("id", o.id);
    toast.success("Pesanan dibatalkan");
  };

  const filtered = orders.filter((o) => !q || o.order_number.toLowerCase().includes(q.toLowerCase()) || o.customer_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <StaffShell title="Antrian Pesanan">
      <Input placeholder="Cari nomor pesanan / nama…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-muted-foreground shadow-soft">Tidak ada antrian. Pesanan baru akan muncul otomatis.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{o.order_number}</div>
                  <div className="font-bold">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_whatsapp}</div>
                </div>
                <Badge variant="outline">{o.status.replace(/_/g, " ")}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                <Badge variant="secondary">{o.order_type === "DINE_IN" ? `Meja ${o.table_code}` : "Take Away"}</Badge>
                <Badge>{o.payment_method}</Badge>
                <span className="text-muted-foreground">{formatDateTime(o.created_at)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {(itemsBy[o.id] ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.quantity}× {i.product_name}</span><span className="text-muted-foreground">{rupiah(i.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs">Total</span><span className="font-extrabold text-primary">{rupiah(o.total)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {NEXT[o.status] && (
                  <Button size="sm" className="flex-1" onClick={() => advance(o)}>
                    <Check className="h-4 w-4" /> {LABEL_NEXT[o.status]} <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => cancel(o)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </StaffShell>
  );
}
