import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/db";

export type Task = Database["public"]["Tables"]["automation_queue"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["automation_queue"]["Insert"];

export const queueManager = {
  async enqueueTask(task: Omit<TaskInsert, 'id' | 'status' | 'attempts' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data, error } = await supabase
      .from("automation_queue")
      .insert({
        ...task,
        user_id: user.id,
        status: 'pending',
        attempts: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async dequeueTasks(limit: number = 10): Promise<Task[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Atomically find and mark tasks as processing to avoid race conditions
    const { data, error } = await supabase
      .from("automation_queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("run_at", new Date().toISOString())
      .order("run_at", { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    const taskIds = data.map((t) => t.id);
    await supabase
      .from("automation_queue")
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .in("id", taskIds);

    return data;
  },

  async markCompleted(id: string) {
    await supabase
      .from("automation_queue")
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq("id", id);
  },

  async markFailed(id: string, error: string, retryAt?: string) {
    const { data: task } = await supabase
      .from("automation_queue")
      .select("attempts, max_attempts")
      .eq("id", id)
      .single();

    if (!task) return;

    if (task.attempts + 1 < task.max_attempts) {
      await supabase
        .from("automation_queue")
        .update({ 
          status: 'pending', 
          attempts: (task.attempts || 0) + 1,
          run_at: retryAt || new Date(Date.now() + 5 * 60000).toISOString(), // default 5m retry
          error_message: error,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
    } else {
      await supabase
        .from("automation_queue")
        .update({ 
          status: 'failed', 
          attempts: (task.attempts || 0) + 1,
          error_message: error,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
    }
  }
};
