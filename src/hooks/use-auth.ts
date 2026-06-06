import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "owner" | "cashier";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (!mounted) return;
      setRoles((data?.map((r) => r.role as Role) ?? []));
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setLoading(true);
        setTimeout(() => loadRoles(s.user!.id), 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadRoles(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session, user, roles, loading,
    isOwner: roles.includes("owner"),
    isCashier: roles.includes("cashier"),
    isStaff: roles.length > 0,
  };
}
