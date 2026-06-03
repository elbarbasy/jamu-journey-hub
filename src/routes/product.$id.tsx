import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { useCart, type Customization } from "@/lib/cart";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

type P = {
  id: string; name: string; description: string; price: number; image_url: string | null;
  ingredients: string[]; flavor_tags: string[]; experience_tags: string[];
  supports_sweetness: boolean; supports_creamy: boolean; supports_temperature: boolean;
};

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Detail Produk — MAJAMU" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const [p, setP] = useState<P | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [cust, setCust] = useState<Customization>({ sweetness: "Normal", creamy: false, temperature: "Hot" });
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    supabase.from("products").select("*").eq("id", id).maybeSingle().then(({ data }) => setP((data as P | null) ?? null));
  }, [id]);

  if (p === undefined) return <Loader />;
  if (p === null) return <div className="p-8 text-center">Produk tidak ditemukan.</div>;

  const onAdd = () => {
    add({ productId: p.id, name: p.name, price: p.price, quantity: qty, customization: cust, image_url: p.image_url });
    toast.success(`${qty}× ${p.name} ditambahkan ke keranjang`);
    nav({ to: "/menu" });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-6xl">🌿</div>}
        </div>
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-extrabold">{p.name}</h1>
          <div className="mt-1 text-xl font-bold text-primary">{rupiah(p.price)}</div>
          <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>

          <Section title="Bahan">
            <div className="flex flex-wrap gap-1.5">
              {p.ingredients.map((i) => <Pill key={i}>{i}</Pill>)}
            </div>
          </Section>

          <Section title="Profil Rasa">
            <div className="flex flex-wrap gap-1.5">
              {p.flavor_tags.map((i) => <Pill key={i} variant="primary">{i}</Pill>)}
              {p.experience_tags.map((i) => <Pill key={i} variant="secondary">{i}</Pill>)}
            </div>
          </Section>

          {p.supports_sweetness && (
            <Section title="Kemanisan">
              <Choice value={cust.sweetness} options={["Less","Normal","Extra"]} onChange={(v) => setCust({ ...cust, sweetness: v as Customization["sweetness"] })} />
            </Section>
          )}
          {p.supports_temperature && (
            <Section title="Suhu">
              <Choice value={cust.temperature} options={["Hot","Cold"]} onChange={(v) => setCust({ ...cust, temperature: v as Customization["temperature"] })} />
            </Section>
          )}
          {p.supports_creamy && (
            <Section title="Creamy">
              <Choice value={cust.creamy ? "Ya" : "Tidak"} options={["Tidak","Ya"]} onChange={(v) => setCust({ ...cust, creamy: v === "Ya" })} />
            </Section>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 rounded-full bg-muted p-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-bold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"><Plus className="h-4 w-4" /></button>
          </div>
          <Button onClick={onAdd} className="flex-1" size="lg">Tambah · {rupiah(p.price * qty)}</Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="text-xs font-bold uppercase tracking-widest text-secondary">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Pill({ children, variant = "muted" }: { children: React.ReactNode; variant?: "muted" | "primary" | "secondary" }) {
  const cls = variant === "primary" ? "bg-primary/15 text-primary" : variant === "secondary" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{children}</span>;
}
function Choice({ value, options, onChange }: { value: string | undefined; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${value === o ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}
function Loader() { return <div className="p-8 text-center text-muted-foreground">Memuat…</div>; }
