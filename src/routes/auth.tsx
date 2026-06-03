import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Staff Login — MAJAMU" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        if (roles?.some((r) => r.role === "owner")) nav({ to: "/owner" });
        else if (roles?.some((r) => r.role === "cashier")) nav({ to: "/cashier" });
        else nav({ to: "/owner" }); // first user becomes owner via UI
      }
    });
  }, [nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) { toast.error(error.message); setBusy(false); return; }
      // First user becomes owner. Subsequent signups are unassigned until owner promotes.
      if (data.user) {
        const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true });
        if (!count || count === 0) {
          await supabase.from("user_roles").insert({ user_id: data.user.id, role: "owner" });
          toast.success("Akun owner pertama berhasil dibuat.");
        } else {
          toast.success("Akun dibuat. Hubungi owner untuk diberi peran.");
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setBusy(false); return; }
      toast.success("Selamat datang kembali!");
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-sunrise px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-warm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">MAJAMU</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Staff Portal</p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>
          <TabsContent value={mode}>
            <form onSubmit={onSubmit} className="mt-4 grid gap-3">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="n">Nama</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                </div>
              )}
              <div>
                <Label htmlFor="e">Email</Label>
                <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="p">Password</Label>
                <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <Button disabled={busy} type="submit" className="w-full">{busy ? "…" : mode === "login" ? "Masuk" : "Daftar"}</Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Akun pertama yang mendaftar otomatis menjadi <b>Owner</b>.<br />
          Owner dapat menambah peran kasir di dashboard.
        </p>
      </div>
    </div>
  );
}
