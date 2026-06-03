import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset Password — MAJAMU" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password berhasil diperbarui.");
    nav({ to: "/owner" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-sunrise px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-warm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">Atur Password Baru</h1>
          <p className="text-xs text-muted-foreground">Masukkan password baru untuk akun Anda.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <div>
            <Label htmlFor="np">Password baru</Label>
            <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <Button disabled={busy} type="submit" className="w-full">{busy ? "…" : "Simpan"}</Button>
        </form>
      </div>
    </div>
  );
}
