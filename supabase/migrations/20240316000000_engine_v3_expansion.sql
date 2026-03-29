-- Migration: Automation Engine Improvements & Multi-tenancy Phase 2

-- 1. Automation Triggers Table
CREATE TABLE IF NOT EXISTS public.automation_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    trigger_type TEXT NOT NULL, -- 'client_created', 'tag_added', 'message_received', etc.
    conditions JSONB DEFAULT '{}', -- filtering logic
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;

-- 2. Provider Limits (Rate Limiting)
CREATE TABLE IF NOT EXISTS public.provider_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    provider TEXT NOT NULL, -- 'whatsapp', 'telegram', 'instagram'
    messages_per_second DECIMAL DEFAULT 1.0,
    messages_per_minute INTEGER DEFAULT 30,
    daily_quota INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.provider_limits ENABLE ROW LEVEL SECURITY;

-- 3. System Metrics (Telemetria)
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON public.system_metrics(timestamp);

-- 4. System Alerts
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
    alert_type TEXT NOT NULL, -- 'queue_bottleneck', 'worker_failure', 'integration_down'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- RLS Policies simple version
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.automation_triggers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON public.provider_limits FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON public.system_metrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated" ON public.system_alerts FOR ALL TO authenticated USING (true);
