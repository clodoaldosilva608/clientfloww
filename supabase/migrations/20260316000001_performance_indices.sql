-- Migration: Performance Indices for User Data Filtering

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON public.scheduled_messages(user_id);

-- Indices for common lookups
CREATE INDEX IF NOT EXISTS idx_message_logs_client_id ON public.message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON public.client_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_status_run_at ON public.automation_queue(status, run_at);
