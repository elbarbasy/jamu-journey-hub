import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CustomerHeader } from "@/components/customer-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { scoreProducts, type ProductWithMapping } from "@/lib/quiz";
import { rupiah } from "@/lib/format";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

type Q = { id: string; position: number; question: string; options: { id: string; label: string; tag: string }[] };
const DIMS = ["drink", "flavor", "time", "frequency", "experience"] as const;

export const Route = createFileRoute("/quiz")({
  head: () => ({ meta: [{ title: "Quiz Rekomendasi — MAJAMU" }, { name: "description", content: "Temukan jamu yang cocok untukmu lewat kuis singkat 5 pertanyaan." }] }),
  component: QuizPage,
});

function QuizPage() {
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [products, setProducts] = useState<ProductWithMapping[] | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: qs } = await supabase.from("quiz_questions").select("id,position,question").eq("is_active", true).order("position");
      const { data: opts } = await supabase.from("quiz_options").select("id,question_id,label,tag,position").order("position");
      const merged = (qs ?? []).map((q) => ({ ...q, options: (opts ?? []).filter((o) => o.question_id === q.id) }));
      setQuestions(merged as Q[]);
      const { data: ps } = await supabase.from("products").select("id,name,description,price,image_url,ingredients,flavor_tags,experience_tags,quiz_mapping").eq("is_active", true);
      setProducts((ps as ProductWithMapping[] | null) ?? []);
    })();
  }, []);

  const total = questions?.length ?? 5;
  const done = questions && step >= total;
  const top3 = useMemo(() => {
    if (!done || !products) return [];
    return scoreProducts(products, answers).slice(0, 3);
  }, [done, products, answers]);

  if (!questions) return <Loader />;

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-4">
        {!done && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Pertanyaan {step + 1} dari {total}</span>
              <span>{Math.round(((step) / total) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-warm transition-all" style={{ width: `${((step) / total) * 100}%` }} />
            </div>
            <h1 className="mt-6 text-2xl font-extrabold text-balance">{questions[step].question}</h1>
            <div className="mt-5 grid gap-3">
              {questions[step].options.map((opt) => {
                const dim = DIMS[step] ?? "experience";
                const selected = answers[dim] === opt.tag;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers((a) => ({ ...a, [dim]: opt.tag }))}
                    className={`rounded-2xl border-2 p-4 text-left font-semibold transition ${selected ? "border-primary bg-primary/10 shadow-warm" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button onClick={() => setStep((s) => s + 1)} disabled={!answers[DIMS[step] ?? "experience"]} className="flex-1">
                {step === total - 1 ? "Lihat Rekomendasi" : "Lanjut"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {done && (
          <>
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Top 3 untukmu
              </div>
              <h1 className="mt-2 text-2xl font-extrabold">Rekomendasi MAJAMU</h1>
              <p className="mt-1 text-sm text-muted-foreground">Berdasarkan preferensi yang kamu pilih.</p>
            </div>
            <div className="mt-5 grid gap-3">
              {top3.map(({ product: p, score }, i) => (
                <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="relative flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                  <div className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-warm text-xs font-extrabold text-primary-foreground shadow-warm">{i + 1}</div>
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">🌿</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{p.name}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{p.description}</div>
                    <div className="mt-1 text-[10px] text-secondary">Cocok: {score}/{DIMS.length} kriteria</div>
                  </div>
                  <div className="shrink-0 text-right font-bold text-primary">{rupiah(p.price)}</div>
                </Link>
              ))}
            </div>
            <Button variant="outline" className="mt-5 w-full" onClick={() => { setAnswers({}); setStep(0); }}>Ulangi Quiz</Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate({ to: "/menu" })}>Lihat Menu Lengkap</Button>
          </>
        )}
      </main>
    </div>
  );
}

function Loader() { return <div className="p-8 text-center text-muted-foreground">Memuat kuis…</div>; }
