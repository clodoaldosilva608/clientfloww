export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          name: string
          description: string | null
          status: 'draft' | 'active' | 'paused' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'paused' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_steps: {
        Row: {
          id: string
          workflow_id: string
          step_order: number
          step_type: 'send_message' | 'wait' | 'condition' | 'add_tag' | 'remove_tag' | 'start_campaign' | 'webhook'
          config: Json
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          step_order: number
          step_type: 'send_message' | 'wait' | 'condition' | 'add_tag' | 'remove_tag' | 'start_campaign' | 'webhook'
          config?: Json
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          step_order?: number
          step_type?: 'send_message' | 'wait' | 'condition' | 'add_tag' | 'remove_tag' | 'start_campaign' | 'webhook'
          config?: Json
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          client_id: string
          organization_id: string | null
          status: 'running' | 'completed' | 'failed' | 'paused'
          current_step_order: number
          user_id: string
          started_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          workflow_id: string
          client_id: string
          organization_id?: string | null
          status?: 'running' | 'completed' | 'failed' | 'paused'
          current_step_order?: number
          user_id: string
          started_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string
          client_id?: string
          organization_id?: string | null
          status?: 'running' | 'completed' | 'failed' | 'paused'
          current_step_order?: number
          user_id?: string
          started_at?: string
          finished_at?: string | null
        }
        Relationships: []
      }
      workflow_step_logs: {
        Row: {
          id: string
          execution_id: string
          step_id: string | null
          status: string
          response: Json
          executed_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          step_id?: string | null
          status: string
          response?: Json
          executed_at?: string
        }
        Update: {
          id?: string
          execution_id?: string
          step_id?: string | null
          status?: string
          response?: Json
          executed_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          birth_date: string | null
          cep: string | null
          street: string | null
          house_number: string | null
          complement: string | null
          neighborhood: string | null
          city: string | null
          state: string | null
          instagram_id: string | null
          whatsapp_id: string | null
          telegram_chat_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          birth_date?: string | null
          cep?: string | null
          street?: string | null
          house_number?: string | null
          complement?: string | null
          neighborhood?: string | null
          city?: string | null
          state?: string | null
          instagram_id?: string | null
          whatsapp_id?: string | null
          telegram_chat_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          birth_date?: string | null
          cep?: string | null
          street?: string | null
          house_number?: string | null
          complement?: string | null
          neighborhood?: string | null
          city?: string | null
          state?: string | null
          instagram_id?: string | null
          whatsapp_id?: string | null
          telegram_chat_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_tags: {
        Row: {
          id: string
          client_id: string
          tag: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          tag: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          tag?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          client_id: string | null
          campaign_id: string | null
          message: string | null
          platform: string
          direction: string
          status: string
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          client_id?: string | null
          campaign_id?: string | null
          message?: string | null
          platform: string
          direction?: string
          status?: string
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          client_id?: string | null
          campaign_id?: string | null
          message?: string | null
          platform?: string
          direction?: string
          status?: string
          external_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          name: string
          message: string
          platform: string
          status: string
          scheduled_at: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          name: string
          message: string
          platform?: string
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          name?: string
          message?: string
          platform?: string
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_targets: {
        Row: {
          id: string
          campaign_id: string
          client_id: string
          status: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          client_id: string
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          client_id?: string
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          client_id: string
          campaign_id: string | null
          message: string
          channel: string
          status: string
          scheduled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          client_id: string
          campaign_id?: string | null
          message: string
          channel: string
          status?: string
          scheduled_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          client_id?: string
          campaign_id?: string | null
          message?: string
          channel?: string
          status?: string
          scheduled_at?: string
          created_at?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          id: string
          user_id: string
          platform: string
          is_active: boolean
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          is_active?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          is_active?: boolean
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_queue: {
        Row: {
          id: string
          organization_id: string | null
          task_type: string
          payload: Json
          status: 'pending' | 'processing' | 'failed' | 'completed'
          attempts: number
          max_attempts: number
          run_at: string
          error_message: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          task_type: string
          payload: Json
          status?: 'pending' | 'processing' | 'failed' | 'completed'
          attempts?: number
          max_attempts?: number
          run_at: string
          error_message?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          task_type?: string
          payload?: Json
          status?: 'pending' | 'processing' | 'failed' | 'completed'
          attempts?: number
          max_attempts?: number
          run_at?: string
          error_message?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_triggers: {
        Row: {
          id: string
          workflow_id: string
          organization_id: string
          trigger_type: string
          conditions: Json
          is_active: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          organization_id: string
          trigger_type: string
          conditions?: Json
          is_active?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          organization_id?: string
          trigger_type?: string
          conditions?: Json
          is_active?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          id: string
          user_id: string
          level: string
          message: string
          context: string | null
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level: string
          message: string
          context?: string | null
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: string
          message?: string
          context?: string | null
          payload?: Json
          created_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Functions: {
      get_dashboard_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
    }
    Views: {
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
