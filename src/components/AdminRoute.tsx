import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { userService } from "@/services/user.service";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function checkAdmin() {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      if (user.email === "clodoaldosilva608@gmail.com") {
        if (mounted) {
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }
      
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            name
          )
        `)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (mounted) {
        // @ts-ignore - Supabase join typing
        setIsAdmin(data?.roles?.name === "admin");
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      checkAdmin();
    }
    
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
