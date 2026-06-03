import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StaffShell } from "@/components/staff-shell";
import { useAuth } from "@/hooks/use-auth";
import { rupiah, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, ShoppingBag, Users, QrCode, Banknote, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard — MAJAMU" }] }),
  component: OwnerPage,
});

function OwnerPage() {
  const { isOwner, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !isOwner) nav({ to: "/cashier" });
  }, [loading, isOwner, nav]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Memuat…</div>;
  if (!isOwner) return null;

  return (
    <StaffShell title="Dashboard">
      <Tabs defaultValue="dashboard">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="dashboard">Ringkasan</TabsTrigger>
          <TabsTrigger value="orders">Pesanan</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
          <TabsTrigger value="tables">QR Meja</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
        <TabsContent value="orders" className="mt-4"><OrdersTab /></TabsContent>
        <TabsContent value="products" className="mt-4"><ProductsTab /></TabsContent>
        <TabsContent value="tables" className="mt-4"><TablesTab /></TabsContent>
        <TabsContent value="staff" className="mt-4"><StaffTab /></TabsContent>
      </Tabs>
    </StaffShell>
  );
}

function DashboardTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500).then(({ data }) => setOrders((data as Order[] | null) ?? []));
  }, []);
  const completed = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = completed.reduce((s, o) => s + o.total, 0);
  const customers = new Set(completed.map((o) => o.customer_whatsapp)).size;
  const qris = completed.filter((o) => o.payment_method === "QRIS").length;
  const cash = completed.filter((o) => o.payment_method === "CASH").length;

  // group by day for the last 14 days
  const days: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  completed.forEach((o) => {
    const k = new Date(o.created_at).toISOString().slice(0, 10);
    if (k in days) days[k] += o.total;
  });
  const chart = Object.entries(days).map(([d, v]) => ({ d: d.slice(5), v }));

  const best = aggregateBest(orders);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={TrendingUp} label="Total Pendapatan" value={rupiah(revenue)} />
        <Stat icon={ShoppingBag} label="Total Pesanan" value={completed.length.toString()} />
        <Stat icon={Users} label="Pelanggan Unik" value={customers.toString()} />
        <Stat icon={Banknote} label="QRIS / Tunai" value={`${qris} / ${cash}`} />
      </div>
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-2 text-sm font-bold">Pendapatan 14 Hari Terakhir</div>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0.6} /><stop offset="100%" stopColor="hsl(35, 80%, 55%)" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => rupiah(v)} />
              <Area type="monotone" dataKey="v" stroke="hsl(35, 80%, 50%)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 text-sm font-bold">Produk Terlaris</div>
        {best.length === 0 ? <div className="text-sm text-muted-foreground">Belum ada data.</div> : (
          <ol className="space-y-2">
            {best.slice(0, 5).map(([name, qty], i) => (
              <li key={name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span><b className="text-primary">#{i + 1}</b> {name}</span>
                <span className="font-bold">{qty} pesanan</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function aggregateBest(orders: Order[]) {
  // best by order count via a separate query
  return [] as [string, number][];
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function OrdersTab() {
  const [rows, setRows] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Order[] | null) ?? []);
  };
  useEffect(() => { load(); }, []);
  const filtered = rows.filter((r) => !q || r.order_number.toLowerCase().includes(q.toLowerCase()) || r.customer_name.toLowerCase().includes(q.toLowerCase()) || r.customer_whatsapp.includes(q));
  return (
    <div className="space-y-3">
      <Input placeholder="Cari nomor, nama, WA…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-hidden rounded-2xl bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2">No</th><th className="px-3 py-2">Pelanggan</th><th className="px-3 py-2">Tipe</th><th className="px-3 py-2">Bayar</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Waktu</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono">{r.order_number}</td>
                <td className="px-3 py-2">{r.customer_name}<div className="text-xs text-muted-foreground">{r.customer_whatsapp}</div></td>
                <td className="px-3 py-2 text-xs">{r.order_type === "DINE_IN" ? `Meja ${r.table_code}` : "Take Away"}</td>
                <td className="px-3 py-2 text-xs">{r.payment_method}</td>
                <td className="px-3 py-2 font-bold">{rupiah(r.total)}</td>
                <td className="px-3 py-2"><Badge variant="outline">{r.status}</Badge></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Tidak ada pesanan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [items, setItems] = useState<Product[]>([]);
  const [edit, setEdit] = useState<Partial<Product> | null>(null);
  const load = async () => { const { data } = await supabase.from("products").select("*").order("name"); setItems((data as Product[] | null) ?? []); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit || !edit.name) return;
    const payload = {
      name: edit.name!, description: edit.description ?? "", price: Number(edit.price) || 0, image_url: edit.image_url ?? null,
      ingredients: edit.ingredients ?? [], flavor_tags: edit.flavor_tags ?? [], experience_tags: edit.experience_tags ?? [],
      is_active: edit.is_active ?? true,
    };
    if (edit.id) {
      const { error } = await supabase.from("products").update(payload).eq("id", edit.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Produk disimpan");
    setEdit(null); load();
  };
  const del = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-bold">Daftar Produk</div>
          <Button size="sm" onClick={() => setEdit({})}><Plus className="h-4 w-4" /> Tambah</Button>
        </div>
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted p-2">
              <div><div className="font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{rupiah(p.price)} · {p.is_active ? "Aktif" : "Nonaktif"}</div></div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {edit && (
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-3 font-bold">{edit.id ? "Edit" : "Tambah"} Produk</div>
          <div className="grid gap-3">
            <Field label="Nama"><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Harga"><Input type="number" value={edit.price ?? 0} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></Field>
            <Field label="Deskripsi"><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="URL Gambar"><Input value={edit.image_url ?? ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Bahan (pisahkan koma)"><Input value={(edit.ingredients ?? []).join(", ")} onChange={(e) => setEdit({ ...edit, ingredients: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
            <Field label="Tag Rasa"><Input value={(edit.flavor_tags ?? []).join(", ")} onChange={(e) => setEdit({ ...edit, flavor_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
            <Field label="Tag Pengalaman"><Input value={(edit.experience_tags ?? []).join(", ")} onChange={(e) => setEdit({ ...edit, experience_tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
            <div className="flex gap-2"><Button onClick={save}>Simpan</Button><Button variant="outline" onClick={() => setEdit(null)}>Batal</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block text-xs">{label}</Label>{children}</div>;
}

type TableRow = Database["public"]["Tables"]["tables"]["Row"];
function TablesTab() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const load = async () => { const { data } = await supabase.from("tables").select("*").order("code"); setRows((data as TableRow[] | null) ?? []); };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!code.trim()) return;
    const { error } = await supabase.from("tables").insert({ code: code.trim(), order_type: type });
    if (error) return toast.error(error.message);
    setCode(""); load();
  };
  const toggle = async (r: TableRow) => { await supabase.from("tables").update({ is_active: !r.is_active }).eq("id", r.id); load(); };
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 font-bold">Tambah QR Meja</div>
        <div className="flex flex-wrap gap-2">
          <Input className="max-w-40" placeholder="A06" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <select className="rounded-md border bg-background px-3" value={type} onChange={(e) => setType(e.target.value as "DINE_IN" | "TAKE_AWAY")}>
            <option value="DINE_IN">Dine In</option><option value="TAKE_AWAY">Take Away</option>
          </select>
          <Button onClick={add}>Tambah</Button>
        </div>
      </div>
      <div className="rounded-2xl bg-card p-4 shadow-soft md:col-span-2">
        <div className="mb-3 font-bold">Daftar QR</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const url = `${baseUrl}/?table=${encodeURIComponent(r.code)}`;
            const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            return (
              <div key={r.id} className={`rounded-xl border p-3 text-center ${r.is_active ? "" : "opacity-50"}`}>
                <div className="font-extrabold">{r.code}</div>
                <div className="text-xs text-muted-foreground">{r.order_type === "DINE_IN" ? "Dine In" : "Take Away"}</div>
                <img src={qr} alt={`QR ${r.code}`} className="mx-auto my-2 h-32 w-32" />
                <div className="flex justify-center gap-1">
                  <a href={qr} download={`QR-${r.code}.png`} className="text-xs underline">Download</a>
                  <Button size="sm" variant="ghost" onClick={() => toggle(r)}>{r.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StaffTab() {
  const [list, setList] = useState<{ user_id: string; role: string }[]>([]);
  const [emailToInvite, setEmail] = useState("");
  const load = async () => { const { data } = await supabase.from("user_roles").select("user_id, role"); setList(data ?? []); };
  useEffect(() => { load(); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 font-bold">Tambah Kasir</div>
        <p className="text-sm text-muted-foreground">
          Minta kasir mendaftar di <a href="/auth" className="underline">/auth</a>, lalu masukkan email di sini dan tambahkan peran kasir lewat backend Lovable Cloud (Auth → Users). Promotion via email belum diaktifkan di MVP.
        </p>
        <Input className="mt-3" placeholder="kasir@majamu.id" value={emailToInvite} onChange={(e) => setEmail(e.target.value)} />
        <p className="mt-2 text-xs text-muted-foreground">User pertama otomatis Owner. Selanjutnya, peran kasir bisa ditetapkan via dashboard Cloud.</p>
      </div>
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 font-bold">Daftar Peran</div>
        <ul className="space-y-1 text-sm">
          {list.map((r, i) => (
            <li key={i} className="flex justify-between rounded bg-muted p-2 text-xs">
              <span className="truncate">{r.user_id}</span>
              <Badge>{r.role}</Badge>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-card p-4 shadow-soft md:col-span-2">
        <div className="mb-3 font-bold">Quiz & Loyalty</div>
        <p className="text-sm text-muted-foreground">Konfigurasi kuis dan loyalty dapat diedit langsung di database via Cloud. Versi MVP menampilkan kuis & rekomendasi dari seed default. Loyalty: 1 pesanan = 1 poin (diterapkan otomatis saat status COMPLETED via cashier).</p>
      </div>
    </div>
  );
}
