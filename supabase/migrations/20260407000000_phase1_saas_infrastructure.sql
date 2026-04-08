-- FASE 1: Banco de Dados Profissional (Versão Segura para tabelas pré-existentes)

-- ROLES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS roles_user_id_idx ON public.roles(user_id);
CREATE INDEX IF NOT EXISTS roles_created_at_idx ON public.roles(created_at);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS user_roles_created_at_idx ON public.user_roles(created_at);

-- APP_SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- UNIQUE index conditionally - requires a bit of workaround or just normal unique constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_user_id_key') THEN
        ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS app_settings_user_id_idx ON public.app_settings(user_id);
CREATE INDEX IF NOT EXISTS app_settings_created_at_idx ON public.app_settings(created_at);

-- STRIPE_PRODUCTS
CREATE TABLE IF NOT EXISTS public.stripe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.stripe_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stripe_products_stripe_product_id_key') THEN
        ALTER TABLE public.stripe_products ADD CONSTRAINT stripe_products_stripe_product_id_key UNIQUE (stripe_product_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS stripe_products_user_id_idx ON public.stripe_products(user_id);
CREATE INDEX IF NOT EXISTS stripe_products_created_at_idx ON public.stripe_products(created_at);

-- USER_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.stripe_products(id) ON DELETE SET NULL;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_user_id_key') THEN
        ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_stripe_subscription_id_key') THEN
        ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS user_subscriptions_created_at_idx ON public.user_subscriptions(created_at);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);

-- STRIPE_EVENTS
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.stripe_events ADD COLUMN IF NOT EXISTS event_id TEXT;
ALTER TABLE public.stripe_events ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.stripe_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stripe_events_event_id_key') THEN
        ALTER TABLE public.stripe_events ADD CONSTRAINT stripe_events_event_id_key UNIQUE (event_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS stripe_events_event_id_idx ON public.stripe_events(event_id);
CREATE INDEX IF NOT EXISTS stripe_events_created_at_idx ON public.stripe_events(created_at);

-- Ativar Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
