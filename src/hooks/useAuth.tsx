import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { AutomationWorker } from "@/services/automation.worker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  organization: { id: string; name: string } | null;
  role: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserOrg = async (userId: string) => {
    try {
      // Usamos (supabase as any) para ignorar o erro de tabela inexistente nos tipos locais
      const { data, error } = await (supabase as any)
        .from("organization_users")
        .select(`
          organization_id,
          role_name,
          organizations (id, name)
        `)
        .eq("user_id", userId)
        .maybeSingle(); 

      if (error || !data) {
        console.warn("[AUTH] No organization found for user:", userId);
        setOrganization(null);
        setRole(null);
        return;
      }

      // Casting para garantir que o TS não reclame das propriedades dinâmicas
      const rawData = data as any;
      const orgData = rawData.organizations;
      
      const org = { id: orgData.id, name: orgData.name };
      setOrganization(org);
      setRole(rawData.role_name);
      return org;
    } catch (err) {
      console.error("[AUTH] Error fetching user organization:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const updateState = async (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      
      if (sess?.user) {
        const org = await fetchUserOrg(sess.user.id);
        if (org?.id) {
          AutomationWorker.getInstance().start(org.id);
        }
      } else {
        setOrganization(null);
        setRole(null);
        AutomationWorker.getInstance().stop();
      }
      
      setLoading(false);
    };

    const init = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        await updateState(initialSession);
      } catch (err) {
        console.error("[AUTH] Fatal init error:", err);
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      console.log("[AUTH] State Change:", _event);
      updateState(sess);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("[AUTH] Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, organization, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
