-- =========================================================
-- FASE 7 — IA & ANALYTICS ENGINE (ClientFlow Connect)
-- =========================================================

-- 1. View: client_metrics (base para todos os cálculos de IA)
create or replace view client_metrics as
select
  c.id,
  c.name,
  c.organization_id,
  c.created_at,
  count(m.id)                                                       as total_messages,
  max(m.created_at)                                                 as last_interaction,
  count(case when m.status = 'delivered' then 1 end)                as delivered,
  count(case when m.status = 'failed'    then 1 end)                as failed,
  count(case when m.status = 'pending'   then 1 end)                as pending,
  -- Days since last interaction
  extract(epoch from (now() - max(m.created_at))) / 86400           as days_since_interaction,
  -- Delivery rate %
  case 
    when count(m.id) > 0 
    then round((count(case when m.status = 'delivered' then 1 end)::numeric / count(m.id)) * 100, 2)
    else 0 
  end                                                               as delivery_rate
from clients c
left join message_logs m on m.client_id = c.id
group by c.id, c.name, c.organization_id, c.created_at;

-- 2. Table: ai_insights (cache de insights pré-calculados)
create table if not exists ai_insights (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references organizations(id) on delete cascade,
  type             text not null,   -- 'churn_risk', 'best_hour', 'channel', 'vip_inactive', 'campaign_suggestion'
  title            text not null,
  description      text not null,
  severity         text default 'info', -- 'info', 'warning', 'critical', 'success'
  action_type      text,               -- 'navigate', 'create_campaign', 'tag_clients'
  action_payload   jsonb,
  client_ids       uuid[],             -- clients afetados por este insight
  metadata         jsonb,              -- dados adicionais (scores, horas, etc.)
  expires_at       timestamp default (now() + interval '6 hours'),
  created_at       timestamp default now()
);

-- RLS para ai_insights
alter table ai_insights enable row level security;

create policy "Org members can read insights"
  on ai_insights for select
  using (
    organization_id in (
      select organization_id from organization_users where user_id = auth.uid()
    )
  );

create policy "Org members can insert insights"
  on ai_insights for insert
  with check (
    organization_id in (
      select organization_id from organization_users where user_id = auth.uid()
    )
  );

create policy "Org members can delete insights"
  on ai_insights for delete
  using (
    organization_id in (
      select organization_id from organization_users where user_id = auth.uid()
    )
  );

-- 3. Index para performance
create index if not exists idx_ai_insights_org_type on ai_insights(organization_id, type);
create index if not exists idx_ai_insights_expires_at on ai_insights(expires_at);

-- 4. Função SQL: best_send_hour (análise estatística pura no DB)
create or replace function get_best_send_hour(p_org_id uuid)
returns integer
language sql stable
as $$
  select 
    extract(hour from created_at)::integer as send_hour
  from message_logs
  where 
    organization_id = p_org_id
    and status = 'delivered'
    and created_at >= now() - interval '30 days'
  group by send_hour
  order by count(*) desc
  limit 1;
$$;

-- 5. Função SQL: get_churn_risk_clients
create or replace function get_churn_risk_clients(p_org_id uuid)
returns table(
  client_id        uuid,
  client_name      text,
  days_inactive    numeric,
  delivery_rate    numeric,
  total_messages   bigint
)
language sql stable
as $$
  select 
    id              as client_id,
    name            as client_name,
    coalesce(days_since_interaction, 999) as days_inactive,
    delivery_rate,
    total_messages
  from client_metrics
  where 
    organization_id = p_org_id
    and (
      days_since_interaction > 15
      or delivery_rate < 50
      or total_messages = 0
    )
  order by days_inactive desc
  limit 50;
$$;

-- 6. Função SQL: get_vip_inactive_clients (clientes vip sem contato)
create or replace function get_vip_inactive_clients(p_org_id uuid)
returns table(client_id uuid, client_name text, days_inactive numeric)
language plpgsql stable
as $$
begin
  return query
    select 
      cm.id,
      cm.name,
      coalesce(cm.days_since_interaction, 999)
    from client_metrics cm
    inner join client_tags ct on ct.client_id = cm.id
    where 
      cm.organization_id = p_org_id
      and lower(ct.tag) in ('vip', 'alto valor', 'fidelizado')
      and coalesce(cm.days_since_interaction, 999) > 10
    order by cm.days_since_interaction desc nulls first
    limit 20;
end;
$$;
