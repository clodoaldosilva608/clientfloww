-- 1. Create Normalized Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 2. Drop broad policies and add specific ones
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.automation_triggers;
CREATE POLICY "Users can manage own triggers" ON public.automation_triggers
    FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.provider_limits;
CREATE POLICY "Users can manage own limits" ON public.provider_limits
    FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.system_metrics;
CREATE POLICY "Users can view own metrics" ON public.system_metrics
    FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.system_alerts;
CREATE POLICY "Users can manage own alerts" ON public.system_alerts
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. Enhance Multi-tenancy on junction tables
ALTER TABLE IF EXISTS public.client_tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS public.campaign_targets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Ingress missing user_id values from parent objects (if data exists)
UPDATE public.client_tags ct
SET user_id = c.user_id
FROM public.clients c
WHERE ct.client_id = c.id AND ct.user_id IS NULL;

UPDATE public.campaign_targets ct
SET user_id = camp.user_id
FROM public.campaigns camp
WHERE ct.campaign_id = camp.id AND ct.user_id IS NULL;

-- 5. Performance Optimization (Missing Indexes)
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON public.client_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_user_id ON public.client_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON public.campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_user_id ON public.campaign_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

-- 6. Fix client_tags policies to be direct
DROP POLICY IF EXISTS "Users can manage tags of own clients" ON public.client_tags;
CREATE POLICY "Users can manage own client tags" ON public.client_tags
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 7. Fix campaign_targets policies to be direct
DROP POLICY IF EXISTS "Users can manage targets of own campaigns" ON public.campaign_targets;
CREATE POLICY "Users can manage own campaign targets" ON public.campaign_targets
    FOR ALL TO authenticated USING (auth.uid() = user_id);
