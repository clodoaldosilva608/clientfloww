import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Safely converts a Stripe Unix timestamp (seconds) to an ISO string.
 * Returns null if the value is falsy or not a valid number.
 */
function toISO(epoch: number | null | undefined): string | null {
  if (!epoch || typeof epoch !== "number") return null;
  return new Date(epoch * 1000).toISOString();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await buffer(req);
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return res.status(400).json({ error: err.message });
    }

    // FASE 4: Idempotency (prevent duplicate events)
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_events")
      .select("id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed. Ignoring.`);
      return res.status(200).json({ received: true });
    }

    await supabaseAdmin.from("stripe_events").insert({
      event_id: event.id,
      type: event.type,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodStart = toISO((sub as any).current_period_start);
          const periodEnd = toISO((sub as any).current_period_end);

          await supabaseAdmin.from("user_subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: sub.status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
          }, { onConflict: 'user_id' }); 
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const periodStart = toISO((sub as any).current_period_start);
        const periodEnd = toISO((sub as any).current_period_end);

        await supabaseAdmin.from("user_subscriptions").update({
          status: sub.status,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
        }).eq("stripe_subscription_id", sub.id);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin.from("user_subscriptions").update({
          status: "canceled",
          cancel_at_period_end: true,
        }).eq("stripe_subscription_id", sub.id);
        break;
      }
      case "invoice.payment_succeeded": {
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    res.status(500).json({ error: "Webhook Error" });
  }
}
