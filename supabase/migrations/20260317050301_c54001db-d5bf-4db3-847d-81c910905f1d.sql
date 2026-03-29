
-- Find tables without RLS and enable it
-- First check which tables lack RLS
-- The pre-existing tables: messages, scheduled_messages, flows, flow_steps, flow_executions, integrations, users, logs, api_keys, webhooks, subscriptions, user_usage, plan_limits, message_templates

-- Enable RLS on all pre-existing tables that may be missing it
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_templates ENABLE ROW LEVEL SECURITY;
