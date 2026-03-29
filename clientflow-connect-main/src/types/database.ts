/**
 * src/types/database.ts
 * Global Types for ClientFlow SaaS (Phase 3 Strict)
 */

export interface Organization {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'past_due';
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  city?: string;
  organization_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  platform: 'whatsapp' | 'telegram' | 'instagram';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_at?: string;
  organization_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  target_count?: number; 
}

export interface CampaignTarget {
  id: string;
  campaign_id: string;
  client_id: string;
  organization_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface FlowStep {
  id: string;
  flow_id: string;
  type: string;
  config: Record<string, any>;
  position: number;
  organization_id: string;
  created_at: string;
}

export interface MessageLog {
  id: string;
  client_id: string;
  campaign_id?: string;
  message: string;
  status: string;
  direction?: string;
  platform?: string;
  external_id?: string;
  organization_id: string;
  user_id: string;
  created_at: string;
}

export interface IntegrationConfig {
  id: string;
  platform: string;
  is_active: boolean;
  config: Record<string, any>;
  organization_id: string;
  user_id: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  organization_id: string;
}

export interface ClientTag {
  id: string;
  client_id: string;
  tag: string;
  organization_id: string;
  user_id: string;
}

export interface AutomationQueue {
  id: string;
  organization_id: string;
  workflow_id: string;
  step_id?: string;
  client_id?: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  run_at: string;
  locked_at?: string;
  locked_by?: string;
  error_log?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// Phase 6 — SaaS Billing & Monetization Types
// =============================================

export interface PlanLimits {
  clients: number | null;       // null = unlimited
  campaigns: number | null;
  automations: number | null;
  messages_per_month: number | null;
}

export interface PlanFeatures {
  basic: boolean;
  automation: boolean;
  ai_copilot: boolean;
  priority_support: boolean;
  white_label: boolean;
  api_access: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  stripe_price_id: string | null;
  features: PlanFeatures;
  limits: PlanLimits;
  is_popular?: boolean;
  created_at: string;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  plan?: Plan;
}

// Service Response Standard (Phase 3 - Step 4)
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}
