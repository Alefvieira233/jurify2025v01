/**
 * Supabase Database Types
 *
 * Tipos gerados para o schema do banco de dados Supabase.
 * Este arquivo deve ser atualizado com `supabase gen types typescript`.
 */

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
      leads: {
        Row: {
          id: string
          nome: string | null
          email: string | null
          telefone: string | null
          mensagem_inicial: string | null
          area_juridica: string | null
          status: string | null
          origem: string | null
          tenant_id: string | null
          responsavel_id: string | null
          descricao: string | null
          metadata: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome?: string | null
          email?: string | null
          telefone?: string | null
          mensagem_inicial?: string | null
          area_juridica?: string | null
          status?: string | null
          origem?: string | null
          tenant_id?: string | null
          responsavel_id?: string | null
          descricao?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string | null
          email?: string | null
          telefone?: string | null
          mensagem_inicial?: string | null
          area_juridica?: string | null
          status?: string | null
          origem?: string | null
          tenant_id?: string | null
          responsavel_id?: string | null
          descricao?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          nome: string | null
          tenant_id: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          nome?: string | null
          tenant_id?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          nome?: string | null
          tenant_id?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      agentes_ia: {
        Row: {
          id: string
          nome: string
          tipo: string | null
          descricao: string | null
          prompt_base: string | null
          status: string | null
          tenant_id: string | null
          configuracao: Json | null
          area_juridica: string | null
          descricao_funcao: string | null
          objetivo: string | null
          perguntas_qualificacao: string[] | null
          keywords_acao: string[] | null
          parametros_avancados: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          tipo?: string | null
          descricao?: string | null
          prompt_base?: string | null
          status?: string | null
          tenant_id?: string | null
          configuracao?: Json | null
          area_juridica?: string | null
          descricao_funcao?: string | null
          objetivo?: string | null
          perguntas_qualificacao?: string[] | null
          keywords_acao?: string[] | null
          parametros_avancados?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string | null
          descricao?: string | null
          prompt_base?: string | null
          status?: string | null
          tenant_id?: string | null
          configuracao?: Json | null
          area_juridica?: string | null
          descricao_funcao?: string | null
          objetivo?: string | null
          perguntas_qualificacao?: string[] | null
          keywords_acao?: string[] | null
          parametros_avancados?: Json | null
          created_at?: string
          updated_at?: string | null
        }
      }
      contratos: {
        Row: {
          id: string
          lead_id: string | null
          tenant_id: string | null
          tipo_contrato: string | null
          status_assinatura: string | null
          valor_total: string | null
          forma_pagamento: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          tenant_id?: string | null
          tipo_contrato?: string | null
          status_assinatura?: string | null
          valor_total?: string | null
          forma_pagamento?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          tenant_id?: string | null
          tipo_contrato?: string | null
          status_assinatura?: string | null
          valor_total?: string | null
          forma_pagamento?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      agendamentos: {
        Row: {
          id: string
          lead_id: string | null
          tenant_id: string | null
          titulo: string | null
          data_hora: string | null
          duracao_minutos: number | null
          status: string | null
          tipo: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          tenant_id?: string | null
          titulo?: string | null
          data_hora?: string | null
          duracao_minutos?: number | null
          status?: string | null
          tipo?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          tenant_id?: string | null
          titulo?: string | null
          data_hora?: string | null
          duracao_minutos?: number | null
          status?: string | null
          tipo?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      agent_executions: {
        Row: {
          id: string
          execution_id: string | null
          lead_id: string | null
          tenant_id: string | null
          user_id: string | null
          status: string | null
          current_agent: string | null
          current_stage: string | null
          started_at: string | null
          completed_at: string | null
          total_duration_ms: number | null
          agents_involved: string[] | null
          total_agents_used: number | null
          total_tokens: number | null
          estimated_cost_usd: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          execution_id?: string | null
          lead_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          status?: string | null
          current_agent?: string | null
          current_stage?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_duration_ms?: number | null
          agents_involved?: string[] | null
          total_agents_used?: number | null
          total_tokens?: number | null
          estimated_cost_usd?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string | null
          lead_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          status?: string | null
          current_agent?: string | null
          current_stage?: string | null
          started_at?: string | null
          completed_at?: string | null
          total_duration_ms?: number | null
          agents_involved?: string[] | null
          total_agents_used?: number | null
          total_tokens?: number | null
          estimated_cost_usd?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      agent_ai_logs: {
        Row: {
          id: string
          execution_id: string | null
          agent_name: string | null
          lead_id: string | null
          tenant_id: string | null
          user_id: string | null
          model: string | null
          status: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          latency_ms: number | null
          result_preview: string | null
          created_at: string
        }
        Insert: {
          id?: string
          execution_id?: string | null
          agent_name?: string | null
          lead_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          model?: string | null
          status?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          latency_ms?: number | null
          result_preview?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          execution_id?: string | null
          agent_name?: string | null
          lead_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
          model?: string | null
          status?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          latency_ms?: number | null
          result_preview?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          plan_id: string | null
          status: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          plan_id?: string | null
          status?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          plan_id?: string | null
          status?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          tenant_id: string | null
          title: string | null
          message: string | null
          type: string | null
          read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          tenant_id?: string | null
          title?: string | null
          message?: string | null
          type?: string | null
          read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          tenant_id?: string | null
          title?: string | null
          message?: string | null
          type?: string | null
          read?: boolean | null
          created_at?: string
        }
      }
      integracoes: {
        Row: {
          id: string
          tenant_id: string | null
          tipo: string | null
          nome: string | null
          configuracao: Json | null
          status: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          tipo?: string | null
          nome?: string | null
          configuracao?: Json | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          tipo?: string | null
          nome?: string | null
          configuracao?: Json | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
