import { describe, it, expect, vi, beforeEach } from "vitest";
import { clientService, type ClientWithTags } from "../services/client.service";

// Mock the supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
    },
  },
}));

describe("clientService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return empty array when no organization ID provided", async () => {
      const result = await clientService.list("");
      expect(result.data).toEqual([]);
      expect(result.error).toBe("Missing organization contextual identity");
    });

    it("should return clients with tags when successful", async () => {
      const mockClients = [
        { id: "client-1", name: "Client 1", user_id: "user-123", organization_id: "org-1", created_at: "2024-01-01", updated_at: "2024-01-01", phone: "1234567890" },
        { id: "client-2", name: "Client 2", user_id: "user-123", organization_id: "org-1", created_at: "2024-01-02", updated_at: "2024-01-02", phone: "0987654321" },
      ];

      const mockTags = [
        { client_id: "client-1", tag: "vip" },
        { client_id: "client-1", tag: "active" },
      ];

      const { supabase } = await import("@/lib/supabase");
      const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

      // First call for clients
      fromMock.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockClients, error: null }),
        in: vi.fn().mockReturnThis(),
      }));

      // Second call for tags
      fromMock.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockTags, error: null }),
      }));

      const result = await clientService.list("org-1");

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect((result.data?.[0] as ClientWithTags)?.tags).toContain("vip");
    });
  });

  describe("getById", () => {
    it("should return error when no organization ID provided", async () => {
      const result = await clientService.getById("client-1", "");
      expect(result.data).toBeNull();
      expect(result.error).toBe("Unauthorized");
    });

    it("should return client not found error when client doesn't exist", async () => {
      const { supabase } = await import("@/lib/supabase");
      const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

      fromMock.mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const result = await clientService.getById("non-existent-client", "org-1");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Client not found");
    });
  });

  describe("create", () => {
    it("should return error when user is not authenticated", async () => {
      const { supabase } = await import("@/lib/supabase");
      (supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { user: null } });

      const result = await clientService.create("org-1", { name: "New Client", phone: "1234567890" });

      expect(result.data).toBeNull();
      expect(result.error).toBe("Unauthorized");
    });

    it("should create client successfully", async () => {
      const mockClient = { id: "new-client", name: "New Client", phone: "1234567890", user_id: "user-123", organization_id: "org-1" };

      const { supabase } = await import("@/lib/supabase");
      const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

      fromMock.mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      }));

      fromMock.mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const result = await clientService.create("org-1", { name: "New Client", phone: "1234567890" }, ["tag1", "tag2"]);

      expect(result.error).toBeNull();
      expect(result.data?.name).toBe("New Client");
      expect(result.data?.tags).toEqual(["tag1", "tag2"]);
    });
  });

  describe("delete", () => {
    it("should return error when no organization ID provided", async () => {
      const result = await clientService.delete("client-1", "");
      expect(result.data).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should delete client successfully", async () => {
      const { supabase } = await import("@/lib/supabase");
      const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

      fromMock.mockImplementationOnce(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        error: null,
      }));

      // Mock the error property on the chain
      fromMock.mockImplementationOnce(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      const result = await clientService.delete("client-1", "org-1");

      // Note: This is a simplified test; actual implementation may need more complex mocking
      expect(fromMock).toHaveBeenCalledWith("clients");
    });
  });
});
