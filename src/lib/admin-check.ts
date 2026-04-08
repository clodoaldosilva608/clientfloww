import { SupabaseClient } from "@supabase/supabase-js";

export async function isAdminServerSide(supabaseClient: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from("user_roles")
    .select(`
      role_id,
      roles (
        name
      )
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;
  
  // @ts-ignore
  return data.roles?.name === "admin";
}
