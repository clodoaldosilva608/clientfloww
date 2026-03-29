/**
 * supabase/functions/stripe-webhook/index.ts
 * Phase 6 — Stripe Webhook Handler (Supabase Edge Function)
 * 
 * Handles all Stripe events and updates the subscriptions table accordingly.
 * Deploy with: supabase functions deploy stripe-webhook
 * 
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!orgId || !planId) {
          console.error("[Webhook] Missing metadata in checkout session");
          break;
        }

        // Upsert subscription
        const { error } = await supabase.from("subscriptions").upsert({
          organization_id: orgId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_id: planId,
          status: "active",
          current_period_end: null, // Will be set by subscription.updated
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id",
          ignoreDuplicates: false,
        });

        if (error) console.error("[Webhook] Error upserting subscription:", error);
        else console.log(`[Webhook] Subscription activated for org: ${orgId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) console.error("[Webhook] Error updating subscription:", error);
        else console.log(`[Webhook] Subscription ${sub.id} updated to: ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        
        // Get the free plan ID
        const { data: freePlan } = await supabase
          .from("plans")
          .select("id")
          .eq("name", "Starter")
          .single();

        // Downgrade to free plan
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan_id: freePlan?.id || null,
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) console.error("[Webhook] Error canceling subscription:", error);
        else console.log(`[Webhook] Subscription ${sub.id} canceled, downgraded to Starter`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
          
          console.log(`[Webhook] Invoice paid for subscription: ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
          
          console.log(`[Webhook] Payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (err: any) {
    console.error("[Webhook] Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
