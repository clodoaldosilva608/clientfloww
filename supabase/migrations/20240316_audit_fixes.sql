-- 1. ADICIONAR COLUNAS FALTANTES PARA MULTI-TENANCY
ALTER TABLE IF EXISTS workflow_executions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS workflow_steps ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS automation_queue ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS automation_triggers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. AJUSTAR INTEGRAÇÕES (Único por plataforma/usuário)
ALTER TABLE IF EXISTS integration_configs DROP CONSTRAINT IF EXISTS integration_configs_user_id_platform_key;
ALTER TABLE IF EXISTS integration_configs ADD CONSTRAINT integration_configs_user_id_platform_key UNIQUE (user_id, platform);

-- 3. AJUSTAR RLS (Row Level Security)
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS automation_queue ENABLE ROW LEVEL SECURITY;

-- Exemplo de política para clients (aplicar padrão similar para outras)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own clients') THEN
        CREATE POLICY "Users can access their own clients" ON clients
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 4. CRIAR TABELA DE LOGS DO SISTEMA (Phase 12)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE IF EXISTS system_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own logs') THEN
        CREATE POLICY "Users can access their own logs" ON system_logs
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 5. CRIAR RPC PARA DASHBOARD (Phase 6)
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

    SELECT count(*) INTO v_total_clients FROM clients WHERE user_id = p_user_id;
    SELECT count(*) INTO v_total_messages FROM message_logs WHERE user_id = p_user_id;
    SELECT count(*) INTO v_delivered_messages FROM message_logs WHERE user_id = p_user_id AND status = 'delivered';
    SELECT count(*) INTO v_active_campaigns FROM campaigns WHERE user_id = p_user_id AND status IN ('sent', 'running');

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

-- 4. ÍNDICES DE PERFORMANCE (Phase 9)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_client_id ON message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_queue_run_at ON automation_queue(run_at);
