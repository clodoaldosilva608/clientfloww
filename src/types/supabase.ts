export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          notifications_enabled: boolean
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          notifications_enabled?: boolean
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          notifications_enabled?: boolean
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      stripe_products: {
        Row: {
          id: string
          user_id: string
          stripe_product_id: string
          name: string
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_product_id: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_product_id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          product_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          product_id?: string | null
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          product_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource: string
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource?: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
      stripe_events: {
        Row: {
          id: string
          event_id: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          type?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
