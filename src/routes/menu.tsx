import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { ProductSheet } from "@/components/product-sheet";
import { supabase } from "@/integrations/supabase/client";
import { rupiah } from "@/lib/format";
import { Sparkles } from "lucide-react";

type P = {
  id: string; name: string; description: string; price: number;
  image_url: string | null; flavor_tags: string[]; experience_tags: string[];
};

const EXPERIENCES = ["Warm Up", "Relaxing Time", "Accompany Activities", "Traditional Flavor"] as const;

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "Menu — MAJAMU" }, { name: "description", content: "Jelajahi semua jamu tradisional dan racikan modern MAJAMU." }] }),
  component: MenuPage,
});

function MenuPage() {
  const [items, setItems] = useState<P[] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("products").select("id,name,description,price,image_url,flavor_tags,experience_tags").eq("is_active", true).order("name").then(({ data }) => setItems((data as P[] | null) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (!filter) return items;
    return items.filter((p) => p.experience_tags.includes(filter));
  }, [items, filter]);

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Menu</h1>
          <Link to="/quiz" className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
            <Sparkles className="h-3 w-3" /> Quiz
          </Link>
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip active={filter === null} onClick={() => setFilter(null)}>Semua</FilterChip>
          {EXPERIENCES.map((e) => (
            <FilterChip key={e} active={filter === e} onClick={() => setFilter(e)}>{e}</FilterChip>
          ))}
        </div>

        {filtered === null ? (
          <div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">Belum ada menu untuk kategori ini.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {filtered.map((p) => (
              <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-soft transition active:scale-[0.99]">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center text-2xl">🌿</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold leading-tight">{p.name}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{p.description}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.flavor_tags.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{t}</span>)}
                  </div>
                </div>
                <div className="shrink-0 text-right font-bold text-primary">{rupiah(p.price)}</div>
              </button>
            ))}
          </div>
        )}
      </main>

      <ProductSheet productId={openId} open={openId !== null} onOpenChange={(v) => { if (!v) setOpenId(null); }} />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-xs font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
      {children}
    </button>
  );
}
