import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CustomerHeader } from "@/components/customer-header";
import { Button } from "@/components/ui/button";
import { Leaf, Sparkles, QrCode, ShoppingBag, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import heroImg from "@/assets/hero-jamu.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAJAMU — Tradisi yang Dimajukan" },
      { name: "description", content: "Smart Jamu Discovery & Self-Service Ordering. Scan QR meja, pesan, dan dapatkan struk via WhatsApp." },
      { property: "og:title", content: "MAJAMU — Tradisi yang Dimajukan" },
      { property: "og:description", content: "Pesan jamu favoritmu, scan QR, bayar QRIS, struk via WhatsApp." },
    ],
  }),
  component: Home,
  validateSearch: (s: Record<string, unknown>) => ({ table: typeof s.table === "string" ? s.table : undefined }),
});

function Home() {
  const { table } = Route.useSearch();
  const { setContext, ctx } = useCart();
  const navigate = useNavigate();
  const [resolving, setResolving] = useState(!!table);

  useEffect(() => {
    if (!table) return;
    // Sederhana: treat ?table=NN sebagai dine-in dengan kode meja apa adanya.
    setContext({ tableCode: table, orderType: "DINE_IN" });
    navigate({ to: "/menu" });
    setResolving(false);
  }, [table, setContext, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <section className="relative mt-4 overflow-hidden rounded-3xl shadow-warm">
          <img src={heroImg} alt="Aneka jamu tradisional Indonesia" width={1536} height={1024} className="h-64 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-background">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
              <Sparkles className="h-3 w-3" /> Smart Jamu Discovery
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-balance">Jamu untuk hari ini, dipilih untukmu.</h1>
            <p className="mt-1 text-sm opacity-90">Pesan langsung dari meja, atau ikuti kuis singkat untuk rekomendasi.</p>
          </div>
        </section>

        {resolving && <div className="mt-4 rounded-xl bg-card p-4 text-sm">Menyiapkan meja {table}…</div>}

        <section className="mt-5 grid gap-3">
          <Link to="/quiz" className="group rounded-2xl bg-gradient-warm p-5 text-primary-foreground shadow-warm transition active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/20 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold">Mulai Quiz Rekomendasi</div>
                <div className="text-sm opacity-90">5 pertanyaan singkat, kami pilihkan top 3 jamu untukmu.</div>
              </div>
            </div>
          </Link>

          <Link to="/menu" className="group rounded-2xl bg-card p-5 shadow-soft transition active:scale-[0.99]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Leaf className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold">Lihat Menu Lengkap</div>
                <div className="text-sm text-muted-foreground">Jelajahi semua jamu, racikan klasik & modern.</div>
              </div>
            </div>
          </Link>

          {ctx.tableCode ? (
            <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-secondary">
                <QrCode className="h-4 w-4" />
                {ctx.orderType === "DINE_IN" ? `Meja ${ctx.tableCode}` : "Take Away"}
              </div>
              <div className="mt-1 text-muted-foreground">Pesanan kamu akan diantar / siap di sini.</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center">
              <ScanLine className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Belum scan QR? Pilih opsi:</p>
              <div className="mt-3 flex justify-center gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/" search={{ table: "A01" }}>Coba Meja A01</Link></Button>
                <Button asChild size="sm"><Link to="/" search={{ table: "TA" }}>Take Away</Link></Button>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary">
            <ShoppingBag className="h-3 w-3" /> Cara Pesan
          </div>
          <ol className="mt-3 space-y-2 text-sm">
            <li><b>1.</b> Pilih menu atau ikuti kuis</li>
            <li><b>2.</b> Atur kustomisasi & masukkan ke keranjang</li>
            <li><b>3.</b> Checkout & bayar dengan QRIS atau tunai</li>
            <li><b>4.</b> Terima struk via WhatsApp</li>
          </ol>
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MAJAMU · <Link to="/auth" className="underline">Staff Login</Link>
        </footer>
      </main>
    </div>
  );
}
