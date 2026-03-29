
-- 1. IDENTIFY THE PROBLEM: Foreign Keys are pointing to public.users which is empty.
-- 2. FIX: Backfill public.users and ensure all future users are synced.

-- Backfill public.users from auth.users
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    created_at, 
    updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- Ensure public.profiles is also in sync
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
    id, 
    raw_user_meta_data->>'full_name', 
    created_at, 
    updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Fix/Recreate the trigger to sync both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync to public.users (Used by many FKs)
  INSERT INTO public.users (id, email, name, status, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'active',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  -- Sync to public.profiles
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger is attached (Drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. VERIFY MULTI-TENANCY RLS
-- Ensure clients can be seen by the owner
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
CREATE POLICY "Users can manage own clients" ON public.clients
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add Dashboard RPC if missing or update it
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_clients BIGINT;
    v_total_messages BIGINT;
    v_delivered_messages BIGINT;
    v_active_campaigns BIGINT;
    v_result JSON;
BEGIN
    -- SECURITY: Ensure caller only accesses their own data
    IF p_user_id != auth.uid() AND p_user_id != public.get_user_id_for_auth() THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT count(*) INTO v_total_clients FROM public.clients WHERE user_id = p_user_id;
    SELECT count(*) INTO v_total_messages FROM public.message_logs WHERE user_id = p_user_id;
    SELECT count(*) INTO v_delivered_messages FROM public.message_logs WHERE user_id = p_user_id AND status = 'delivered';
    SELECT count(*) INTO v_active_campaigns FROM public.campaigns WHERE user_id = p_user_id AND status IN ('sent', 'running');

    v_result := json_build_object(
        'total_clients', v_total_clients,
        'total_messages', v_total_messages,
        'delivered_messages', v_delivered_messages,
        'active_campaigns', v_active_campaigns,
        'response_rate', CASE WHEN v_total_messages > 0 THEN round((v_delivered_messages::numeric / v_total_messages::numeric) * 100) ELSE 0 END
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
