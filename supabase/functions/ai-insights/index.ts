// supabase/functions/ai-insights/index.ts
// Phase 7 — AI Insights Edge Function
// Returns pre-computed insights for an organization (server-side computation)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InsightResult {
  churnRiskClients: any[];
  vipInactiveClients: any[];
  bestSendHour: number | null;
  channelStats: Record<string, { sent: number; delivered: number; rate: number }>;
  engagementSummary: {
    totalClients: number;
    avgDeliveryRate: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { organization_id } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing organization_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Churn risk clients
    const { data: churnClients } = await supabase.rpc("get_churn_risk_clients", {
      p_org_id: organization_id,
    });

    // 2. VIP inactive clients
    const { data: vipClients } = await supabase.rpc("get_vip_inactive_clients", {
      p_org_id: organization_id,
    });

    // 3. Best send hour
    const { data: bestHourData } = await supabase.rpc("get_best_send_hour", {
      p_org_id: organization_id,
    });

    // 4. Channel stats
    const { data: channelData } = await supabase
      .from("message_logs")
      .select("status, channel")
      .eq("organization_id", organization_id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const channelStats: Record<string, { sent: number; delivered: number; rate: number }> = {};
    for (const log of channelData || []) {
      const ch = (log as any).channel || "whatsapp";
      if (!channelStats[ch]) channelStats[ch] = { sent: 0, delivered: 0, rate: 0 };
      channelStats[ch].sent++;
      if (log.status === "delivered") channelStats[ch].delivered++;
    }
    for (const ch of Object.keys(channelStats)) {
      const s = channelStats[ch];
      s.rate = s.sent > 0 ? Math.round((s.delivered / s.sent) * 100) : 0;
    }

    // 5. Engagement summary
    const { data: metrics } = await (supabase as any)
      .from("client_metrics")
      .select("total_messages, delivery_rate")
      .eq("organization_id", organization_id);

    const totalClients = (metrics || []).length;
    const avgDeliveryRate =
      totalClients > 0
        ? Math.round(
            (metrics || []).reduce((sum: number, m: any) => sum + Number(m.delivery_rate || 0), 0) /
              totalClients
          )
        : 0;

    const result: InsightResult = {
      churnRiskClients: churnClients || [],
      vipInactiveClients: vipClients || [],
      bestSendHour: bestHourData ?? null,
      channelStats,
      engagementSummary: { totalClients, avgDeliveryRate },
    };

    // Cache this result in ai_insights table
    await (supabase as any)
      .from("ai_insights")
      .delete()
      .eq("organization_id", organization_id)
      .lt("expires_at", new Date().toISOString());

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[ai-insights] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
