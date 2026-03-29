
-- 1. Security Fix for get_dashboard_stats RPC
-- DROP all previous versions to ensure we use the no-parameter one
DROP FUNCTION IF EXISTS public.get_dashboard_stats(uuid);
DROP FUNCTION IF EXISTS public.get_dashboard_stats();

-- Create a version that takes NO parameters and uses auth.uid() internally
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
  -- Get current user ID (supports both direct auth and our users table mapping)
  v_user_id := public.get_user_id_for_auth();
  
  -- Fallback to auth.uid() if mapping not found
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*) INTO v_total_clients
  FROM public.clients WHERE user_id = v_user_id;

  SELECT COUNT(*) INTO v_total_messages
  FROM public.message_logs WHERE user_id = v_user_id;

  SELECT COUNT(*) INTO v_delivered_messages
  FROM public.message_logs WHERE user_id = v_user_id AND status = 'delivered';

  SELECT COUNT(*) INTO v_active_campaigns
  FROM public.campaigns WHERE user_id = v_user_id AND status = 'active';

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

-- 2. Explicitly enable RLS and add policies for ALL tables found in migrations
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own clients" ON public.clients;
CREATE POLICY "Users access own clients" ON public.clients FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own campaigns" ON public.campaigns;
CREATE POLICY "Users access own campaigns" ON public.campaigns FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.message_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own message_logs" ON public.message_logs;
CREATE POLICY "Users access own message_logs" ON public.message_logs FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.client_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own client_tags" ON public.client_tags;
CREATE POLICY "Users access own client_tags" ON public.client_tags FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own integrations" ON public.integration_configs;
CREATE POLICY "Users access own integrations" ON public.integration_configs FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own workflows" ON public.workflows;
CREATE POLICY "Users access own workflows" ON public.workflows FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own workflow_steps" ON public.workflow_steps;
CREATE POLICY "Users access own workflow_steps" ON public.workflow_steps FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own workflow_executions" ON public.workflow_executions;
CREATE POLICY "Users access own workflow_executions" ON public.workflow_executions FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.automation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own queue" ON public.automation_queue;
CREATE POLICY "Users access own queue" ON public.automation_queue FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own logs" ON public.system_logs;
CREATE POLICY "Users access own logs" ON public.system_logs FOR ALL USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 3. Fix Search Path warning for all functions
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;
ALTER FUNCTION public.get_user_id_for_auth() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

