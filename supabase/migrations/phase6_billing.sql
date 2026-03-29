-- ==============================================
-- PHASE 6 — SaaS Billing & Monetization
-- ClientFlow Connect v2
-- ==============================================

-- 1. PLANS TABLE
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric not null default 0,
  stripe_price_id text,
  features jsonb not null default '{}',
  limits jsonb not null default '{}',
  is_popular boolean default false,
  created_at timestamptz default now()
);

-- 2. SUBSCRIPTIONS TABLE
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_id uuid not null references plans(id),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. INDEX for fast lookups
create index if not exists idx_subscriptions_org on subscriptions(organization_id);
create index if not exists idx_subscriptions_stripe on subscriptions(stripe_subscription_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- 4. RLS POLICIES
alter table plans enable row level security;
alter table subscriptions enable row level security;

-- Plans are readable by everyone (public pricing page)
create policy "Plans are viewable by everyone" on plans for select using (true);

-- Subscriptions: only org members can view their own
create policy "Users can view own org subscription" on subscriptions
  for select using (
    organization_id in (
      select organization_id from organization_users where user_id = auth.uid()
    )
  );

-- Only system (service_role) can insert/update subscriptions (via webhooks)
create policy "Service role manages subscriptions" on subscriptions
  for all using (auth.role() = 'service_role');

-- 5. SEED DEFAULT PLANS
insert into plans (name, price, stripe_price_id, features, limits, is_popular) values
(
  'Starter',
  0,
  null,
  '{"basic": true, "automation": false, "ai_copilot": false, "priority_support": false, "white_label": false, "api_access": false}',
  '{"clients": 50, "campaigns": 5, "automations": 2, "messages_per_month": 500}',
  false
),
(
  'Pro',
  49.90,
  null,  -- Substituir pelo price_id real do Stripe
  '{"basic": true, "automation": true, "ai_copilot": true, "priority_support": false, "white_label": false, "api_access": true}',
  '{"clients": 1000, "campaigns": 50, "automations": 20, "messages_per_month": 10000}',
  true
),
(
  'Enterprise',
  199.90,
  null,  -- Substituir pelo price_id real do Stripe
  '{"basic": true, "automation": true, "ai_copilot": true, "priority_support": true, "white_label": true, "api_access": true}',
  '{"clients": null, "campaigns": null, "automations": null, "messages_per_month": null}',
  false
)
on conflict (name) do nothing;

-- 6. FUNCTION: Auto-assign Free plan to new organizations
create or replace function assign_free_plan()
returns trigger as $$
declare
  free_plan_id uuid;
begin
  select id into free_plan_id from plans where name = 'Starter' limit 1;
  
  if free_plan_id is not null then
    insert into subscriptions (organization_id, plan_id, status)
    values (NEW.id, free_plan_id, 'active');
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- 7. TRIGGER: Auto-assign on org creation
drop trigger if exists on_organization_created_assign_plan on organizations;
create trigger on_organization_created_assign_plan
  after insert on organizations
  for each row execute function assign_free_plan();
