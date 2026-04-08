import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: "2023-10-16",
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { returnUrl } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: subData } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subData || !subData.stripe_customer_id) {
      return res.status(400).json({ error: "No billing record found" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subData.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
