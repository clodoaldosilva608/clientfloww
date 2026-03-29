import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const authService = {
  async getUser() {
    return supabase.auth.getUser();
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
