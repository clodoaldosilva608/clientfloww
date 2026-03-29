
-- 1. Add missing columns to clients table
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS birth_date text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS instagram_id text,
  ADD COLUMN IF NOT EXISTS whatsapp_id text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Fix clients RLS: use a function to map auth.uid() to users table
DROP POLICY IF EXISTS "Users access own data" ON public.clients;

-- Create a helper function to get auth user's user_id
CREATE OR REPLACE FUNCTION public.get_user_id_for_auth()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- RLS: allow access if user_id matches EITHER auth.uid() directly OR via users table mapping
CREATE POLICY "Users access own clients"
ON public.clients FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 2. Create client_tags table
CREATE TABLE IF NOT EXISTS public.client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own client_tags" ON public.client_tags FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 3. Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  name text NOT NULL,
  message text NOT NULL DEFAULT '',
  platform text DEFAULT 'whatsapp',
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own campaigns" ON public.campaigns FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 4. Create campaign_targets table
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own campaign_targets" ON public.campaign_targets FOR ALL
USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.user_id = auth.uid() OR c.user_id = public.get_user_id_for_auth())));

-- 5. Create message_logs table
CREATE TABLE IF NOT EXISTS public.message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  campaign_id uuid,
  message text,
  platform text NOT NULL DEFAULT 'whatsapp',
  direction text DEFAULT 'outbound',
  status text DEFAULT 'sent',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own message_logs" ON public.message_logs FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 6. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own profile" ON public.profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create profile for existing user
INSERT INTO public.profiles (id, full_name)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Create integration_configs table
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  is_active boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own integrations" ON public.integration_configs FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- 8. Create get_dashboard_stats RPC function
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
  -- SECURITY: Ensure caller only accesses their own data
  IF p_user_id != auth.uid() AND p_user_id != public.get_user_id_for_auth() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*) INTO v_total_clients
  FROM public.clients WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_messages
  FROM public.message_logs WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_delivered_messages
  FROM public.message_logs WHERE user_id = p_user_id AND status = 'delivered';

  SELECT COUNT(*) INTO v_active_campaigns
  FROM public.campaigns WHERE user_id = p_user_id AND status = 'active';

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
