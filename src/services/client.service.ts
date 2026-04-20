import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Client, ServiceResponse } from "@/types/database";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

// Define extra interface for Client with its list of tags
export interface ClientWithTags extends Client {
  tags: string[];
}

type ClientTagRow = Tables<"client_tags">;
type ClientTagInsert = TablesInsert<"client_tags">;

export const clientService = {
  async list(organizationId: string): Promise<ServiceResponse<ClientWithTags[]>> {
    try {
      if (!organizationId) return { data: [], error: "Missing organization contextual identity" };

      const { data: clientsData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("[Service Error] clientService.list:", error.message);
        return { data: null, error: error.message };
      }

      if (!clientsData || clientsData.length === 0) return { data: [], error: null };
      
      const clientIds = clientsData.map(c => c.id);
      const { data: tagsData, error: tagsError } = await supabase
        .from("client_tags")
        .select("client_id, tag")
        .in("client_id", clientIds)
        .eq("organization_id", organizationId);

      if (tagsError) logger.warn("[Service Warning] tags load error:", tagsError.message);

      const tagsByClient: Record<string, string[]> = {};
      (tagsData || []).forEach((t: Pick<ClientTagRow, 'client_id' | 'tag'>) => {
        if (!tagsByClient[t.client_id]) tagsByClient[t.client_id] = [];
        tagsByClient[t.client_id].push(t.tag);
      });

      const formatted = clientsData.map(c => ({
        ...c,
        tags: tagsByClient[c.id] || [],
      })) as ClientWithTags[];

      return { data: formatted, error: null };
    } catch (err: unknown) {
      logger.error("[System Error] clientService.list critical failure:", err);
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async delete(id: string, organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!organizationId) return { data: false, error: "Unauthorized" };

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        logger.error("[Service Error] clientService.delete:", error.message);
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.delete:", err);
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async getById(id: string, organizationId: string): Promise<ServiceResponse<ClientWithTags | null>> {
    try {
      if (!organizationId) return { data: null, error: "Unauthorized" };

      const { data: clientData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) {
        logger.error("[Service Error] clientService.getById:", error.message);
        return { data: null, error: error.message };
      }

      if (!clientData) return { data: null, error: "Client not found" };

      const { data: tagsData } = await supabase
        .from("client_tags")
        .select("tag")
        .eq("client_id", id)
        .eq("organization_id", organizationId);

      return {
        data: {
          ...clientData,
          tags: (tagsData || []).map((t: Pick<ClientTagRow, 'tag'>) => t.tag),
        } as ClientWithTags,
        error: null
      };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.getById:", err);
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async create(organizationId: string, client: Partial<Client>, tags: string[] = []): Promise<ServiceResponse<ClientWithTags | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) return { data: null, error: "Unauthorized" };

      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...client,
          user_id: user.id,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error || !data) {
        logger.error("[Service Error] clientService.create:", error?.message);
        return { data: null, error: error?.message || "Failed to create" };
      }

      if (tags.length > 0) {
        const tagInserts: ClientTagInsert[] = tags.map(tag => ({
          client_id: data.id,
          tag,
          user_id: user.id,
          organization_id: organizationId
        }));
        await supabase.from("client_tags").insert(tagInserts);
      }

      return {
        data: { ...data, tags } as ClientWithTags,
        error: null
      };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.create:", err);
      return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async update(id: string, organizationId: string, client: Partial<Client>, tags?: string[]): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId) return { data: false, error: "Unauthorized" };

      const { error } = await supabase
        .from("clients")
        .update(client as any)
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) {
        logger.error("[Service Error] clientService.update:", error.message);
        return { data: false, error: error.message };
      }

      if (tags !== undefined) {
        await supabase.from("client_tags").delete().eq("client_id", id).eq("organization_id", organizationId);
        if (tags.length > 0) {
          const tagInserts: ClientTagInsert[] = tags.map(tag => ({
            client_id: id,
            tag,
            user_id: user.id,
            organization_id: organizationId
          }));
          await supabase.from("client_tags").insert(tagInserts);
        }
      }

      return { data: true, error: null };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.update:", err);
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async deleteMany(ids: string[], organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!organizationId || ids.length === 0) return { data: false, error: "Invalid parameters" };
      const { error } = await supabase
        .from("clients")
        .delete()
        .in("id", ids)
        .eq("organization_id", organizationId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.deleteMany:", err);
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  },

  async tagMany(ids: string[], tag: string, organizationId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !organizationId || ids.length === 0) return { data: false, error: "Unauthorized" };

      const records: ClientTagInsert[] = ids.map(clientId => ({
        client_id: clientId,
        tag: tag.trim().toLowerCase(),
        user_id: user.id,
        organization_id: organizationId
      }));

      const { error } = await supabase.from("client_tags").insert(records);
      if (error) throw error;

      return { data: true, error: null };
    } catch (err: unknown) {
      logger.error("[Service Error] clientService.tagMany:", err);
      return { data: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }
};
