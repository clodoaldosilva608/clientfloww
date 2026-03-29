/**
 * supabase/functions/stripe-checkout/index.ts
 * Phase 6 — Creates Stripe Checkout Session (server-side)
 * 
 * Deploy with: supabase functions deploy stripe-checkout
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { organization_id, plan_id, user_email, success_url, cancel_url } = await req.json();

    if (!organization_id || !plan_id) {
      return new Response(
        JSON.stringify({ error: "Missing organization_id or plan_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan.stripe_price_id) {
      return new Response(
        JSON.stringify({ error: "Plan has no Stripe price configured. Configure stripe_price_id in the plans table." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if org already has a Stripe customer
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", organization_id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user_email,
        metadata: { organization_id },
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{
        price: plan.stripe_price_id,
        quantity: 1,
      }],
      success_url: success_url || `${req.headers.get("origin")}/billing?success=true`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/billing?canceled=true`,
      metadata: {
        organization_id,
        plan_id,
      },
      subscription_data: {
        metadata: {
          organization_id,
          plan_id,
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Stripe Checkout] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
