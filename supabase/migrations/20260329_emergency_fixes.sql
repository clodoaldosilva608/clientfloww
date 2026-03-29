
-- EMERGENCY SCHEMA FIXES
-- Created: 2026-03-29
-- Fixes RPC signature mismatches and missing billing relationships

-- 1. DASHBOARD STATS (Support both p_user_id and p_organization_id)
-- We drop the existing function signatures to avoid parameter name mismatch errors
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS public.get_dashboard_stats(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_dashboard_stats(p_organization_id uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_organization_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_total_clients int;
  v_total_messages int;
  v_delivered_messages int;
  v_active_campaigns int;
  v_response_rate numeric;
BEGIN
  -- We now use organization_id for Phase 3+ multi-tenancy
  SELECT COUNT(*) INTO v_total_clients FROM public.clients WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_total_messages FROM public.message_logs WHERE organization_id = p_organization_id;
  SELECT COUNT(*) INTO v_delivered_messages FROM public.message_logs WHERE organization_id = p_organization_id AND status = 'delivered';
  SELECT COUNT(*) INTO v_active_campaigns FROM public.campaigns WHERE organization_id = p_organization_id AND status IN ('active', 'sent');

  IF v_total_messages > 0 THEN
    v_response_rate := ROUND((v_delivered_messages::numeric / v_total_messages) * 100, 1);
  ELSE
    v_response_rate := 0;
  END IF;

  SELECT json_build_object(
    'total_clients', v_total_clients,
    'total_messages', v_total_messages,
    'delivered_messages', v_delivered_messages,
    'active_campaigns', v_active_campaigns,
    'response_rate', v_response_rate
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. REVENUE STATS (Requested by Growth Dashboard)
DROP FUNCTION IF EXISTS public.get_revenue_stats(uuid);
DROP FUNCTION IF EXISTS public.get_revenue_stats(p_organization_id uuid);

CREATE OR REPLACE FUNCTION public.get_revenue_stats(p_organization_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr numeric;
  v_total_revenue numeric;
BEGIN
  -- Sum active subscription prices for the organization
  SELECT COALESCE(SUM(p.price), 0) INTO v_mrr
  FROM public.subscriptions s
  INNER JOIN public.plans p ON s.plan_id = p.id
  WHERE s.organization_id = p_organization_id AND s.status = 'active';

  v_total_revenue := v_mrr; -- Simplified logic for now

  RETURN json_build_object(
    'mrr', v_mrr,
    'total_revenue', v_total_revenue
  );
END;
$$;

-- 3. GRANTS
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_revenue_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_stats(uuid) TO anon;

-- 4. BILLING RELATIONSHIP ENFORCEMENT
-- Ensure plans table exists if not already there
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}',
  limits jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Ensure subscriptions has correctly named plan_id and references plans
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='subscriptions' AND column_name='plan_id'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES public.plans(id);
  END IF;
END $$;

-- 5. SEED DEFAULT PLANS (if empty)
INSERT INTO public.plans (name, price, features, limits)
VALUES 
('Starter', 0, '{"basic": true}', '{"clients": 50}'),
('Pro', 49.9, '{"basic": true, "ai": true}', '{"clients": 1000}'),
('Enterprise', 199.9, '{"basic": true, "ai": true, "white_label": true}', '{"clients": null}')
ON CONFLICT (name) DO NOTHING;
