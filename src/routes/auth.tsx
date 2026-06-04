import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import logo from "@/assets/majamu-logo.jpg.asset.json";

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

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
    const routeFor = async (userId: string) => {
      let { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (!roles || roles.length === 0) {
        const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true });
        if (!count || count === 0) {
          await supabase.from("user_roles").insert({ user_id: userId, role: "owner" });
          roles = [{ role: "owner" }];
        }
      }
      if (roles?.some((r) => r.role === "cashier") && !roles?.some((r) => r.role === "owner")) {
        nav({ to: "/cashier" });
      } else if (roles?.some((r) => r.role === "owner")) {
        nav({ to: "/owner" });
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) setTimeout(() => routeFor(s.user.id), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeFor(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_RE.test(password)) {
      toast.error("Password minimal 8 karakter, harus ada huruf besar, angka, dan karakter khusus.");
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) { toast.error(error.message); setBusy(false); return; }
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

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={async () => {
            const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
            if (res?.error) toast.error(res.error.message);
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Lanjutkan dengan Google
        </Button>

        <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> atau email <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="p">Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={async () => {
                        if (!email) { toast.error("Masukkan email dulu"); return; }
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) toast.error(error.message);
                        else toast.success("Link reset password dikirim ke email.");
                      }}
                    >
                      Lupa password?
                    </button>
                  )}
                </div>
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
