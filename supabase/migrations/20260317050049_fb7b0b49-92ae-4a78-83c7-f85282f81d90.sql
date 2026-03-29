
-- Add unique constraint for integration_configs upsert
ALTER TABLE public.integration_configs 
  ADD CONSTRAINT integration_configs_user_platform_unique UNIQUE (user_id, platform);

-- Create automation_queue table if not exists
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  task_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'completed')),
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  run_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own queue" ON public.automation_queue FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own workflows" ON public.workflows FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 0,
  step_type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own workflow_steps" ON public.workflow_steps FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  organization_id uuid,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  current_step_order int DEFAULT 0,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own workflow_executions" ON public.workflow_executions FOR ALL
USING (user_id = auth.uid() OR user_id = public.get_user_id_for_auth())
WITH CHECK (user_id = auth.uid() OR user_id = public.get_user_id_for_auth());

-- Create workflow_step_logs table
CREATE TABLE IF NOT EXISTS public.workflow_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.workflow_steps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'success',
  response jsonb DEFAULT '{}'::jsonb,
  executed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_step_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own step_logs" ON public.workflow_step_logs FOR ALL
USING (EXISTS (SELECT 1 FROM public.workflow_executions e WHERE e.id = execution_id AND (e.user_id = auth.uid() OR e.user_id = public.get_user_id_for_auth())));
