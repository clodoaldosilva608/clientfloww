-- Final Consolidated Sync Migration
-- Created: 2026-03-25

-- 1. IDENTIFY & SYNC USERS
-- Ensure all auth users have public entries to prevent RLS/RPC failure
INSERT INTO public.users (id, email, name, status, updated_at)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', ''), 'active', NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW();

INSERT INTO public.profiles (id, full_name, updated_at)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. DASHBOARD RPC FIXES
-- We drop existing versions to re-create them with consistent logic
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);

-- VERSION A: NO PARAMETERS (Uses current auth session)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_user_id uuid;
  v_total_clients int;
  v_total_messages int;
  v_delivered_messages int;
  v_active_campaigns int;
  v_response_rate numeric;
BEGIN
  -- We prioritize direct auth.uid() but check public.users for legacy compatibility
  v_user_id := auth.uid();
  
  -- If not logged in, fail
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO v_total_clients FROM public.clients WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_total_messages FROM public.message_logs WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_delivered_messages FROM public.message_logs WHERE user_id = v_user_id AND status = 'delivered';
  SELECT COUNT(*) INTO v_active_campaigns FROM public.campaigns WHERE user_id = v_user_id AND status IN ('active', 'sent');

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

-- VERSION B: WITH USER_ID PARAMETER (Useful for backend/admin/scripts)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid)
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
  -- Security check: User can only see their own data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: User can only access their own stats';
  END IF;

  SELECT COUNT(*) INTO v_total_clients FROM public.clients WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_total_messages FROM public.message_logs WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_delivered_messages FROM public.message_logs WHERE user_id = p_user_id AND status = 'delivered';
  SELECT COUNT(*) INTO v_active_campaigns FROM public.campaigns WHERE user_id = p_user_id AND status IN ('active', 'sent');

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

-- 3. ENFORCE RLS ON ALL TABLES
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own clients" ON public.clients;
CREATE POLICY "Users access own clients" ON public.clients FOR ALL
USING (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE id = auth.uid() OR auth_user_id = auth.uid()));

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own campaigns" ON public.campaigns;
CREATE POLICY "Users access own campaigns" ON public.campaigns FOR ALL
USING (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE id = auth.uid() OR auth_user_id = auth.uid()));

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own message_logs" ON public.message_logs;
CREATE POLICY "Users access own message_logs" ON public.message_logs FOR ALL
USING (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE id = auth.uid() OR auth_user_id = auth.uid()));

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own integrations" ON public.integration_configs;
CREATE POLICY "Users access own integrations" ON public.integration_configs FOR ALL
USING (user_id = auth.uid() OR user_id IN (SELECT id FROM public.users WHERE id = auth.uid() OR auth_user_id = auth.uid()));

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO anon;
