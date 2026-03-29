-- supabase/migrations/phase8_whitelabel.sql
-- Phase 8 - Escala Global & White-Label

-- 1. Extend Organizations Table for White-Label branding
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS primary_color text,
ADD COLUMN IF NOT EXISTS custom_domain text;

-- 2. Add an index for custom_domain resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;

-- 3. Add default language config per organization optionally (or user preference)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language_preference text DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo';
