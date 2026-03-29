import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

export type ScheduledMessage = Database["public"]["Tables"]["scheduled_messages"]["Row"];
export type ScheduledMessageInsert = Database["public"]["Tables"]["scheduled_messages"]["Insert"];

export const schedulerService = {
  async schedule(message: Omit<ScheduledMessageInsert, "id" | "status" | "created_at" | "user_id">): Promise<ScheduledMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("scheduled_messages")
      .insert({ 
        ...message, 
        user_id: user.id, 
        status: 'pending' 
      } as ScheduledMessageInsert)
      .select()
      .single();

    if (error || !data) throw error;
    return data;
  },

  async listPending(): Promise<ScheduledMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async cancel(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("scheduled_messages")
      .update({ status: 'cancelled' })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
  }
};
