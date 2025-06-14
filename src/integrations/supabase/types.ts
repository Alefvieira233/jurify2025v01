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
      agendamentos: {
        Row: {
          area_juridica: string
          created_at: string
          data_hora: string
          google_event_id: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          responsavel: string
          status: string
          updated_at: string
        }
        Insert: {
          area_juridica: string
          created_at?: string
          data_hora: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel: string
          status?: string
          updated_at?: string
        }
        Update: {
          area_juridica?: string
          created_at?: string
          data_hora?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          responsavel?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      agentes_ia: {
        Row: {
          area_juridica: string
          created_at: string
          delay_resposta: number | null
          id: string
          keywords_acao: string[] | null
          nome: string
          objetivo: string
          perguntas_qualificacao: string[] | null
          script_saudacao: string
          status: string
          updated_at: string
        }
        Insert: {
          area_juridica: string
          created_at?: string
          delay_resposta?: number | null
          id?: string
          keywords_acao?: string[] | null
          nome: string
          objetivo: string
          perguntas_qualificacao?: string[] | null
          script_saudacao: string
          status?: string
          updated_at?: string
        }
        Update: {
          area_juridica?: string
          created_at?: string
          delay_resposta?: number | null
          id?: string
          keywords_acao?: string[] | null
          nome?: string
          objetivo?: string
          perguntas_qualificacao?: string[] | null
          script_saudacao?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_integracoes: {
        Row: {
          api_key: string
          atualizado_em: string
          criado_em: string
          data_ultima_sincronizacao: string | null
          endpoint_url: string
          id: string
          nome_integracao: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_integracao"]
        }
        Insert: {
          api_key: string
          atualizado_em?: string
          criado_em?: string
          data_ultima_sincronizacao?: string | null
          endpoint_url: string
          id?: string
          nome_integracao: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_integracao"]
        }
        Update: {
          api_key?: string
          atualizado_em?: string
          criado_em?: string
          data_ultima_sincronizacao?: string | null
          endpoint_url?: string
          id?: string
          nome_integracao?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_integracao"]
        }
        Relationships: []
      }
      contratos: {
        Row: {
          area_juridica: string
          clausulas_customizadas: string | null
          created_at: string
          data_assinatura: string | null
          data_envio: string | null
          data_envio_whatsapp: string | null
          data_geracao_link: string | null
          id: string
          lead_id: string | null
          link_assinatura_zapsign: string | null
          nome_cliente: string
          observacoes: string | null
          responsavel: string
          status: string
          status_assinatura: string | null
          texto_contrato: string
          updated_at: string
          valor_causa: number
          zapsign_document_id: string | null
        }
        Insert: {
          area_juridica: string
          clausulas_customizadas?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          data_envio_whatsapp?: string | null
          data_geracao_link?: string | null
          id?: string
          lead_id?: string | null
          link_assinatura_zapsign?: string | null
          nome_cliente: string
          observacoes?: string | null
          responsavel: string
          status?: string
          status_assinatura?: string | null
          texto_contrato: string
          updated_at?: string
          valor_causa: number
          zapsign_document_id?: string | null
        }
        Update: {
          area_juridica?: string
          clausulas_customizadas?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          data_envio_whatsapp?: string | null
          data_geracao_link?: string | null
          id?: string
          lead_id?: string | null
          link_assinatura_zapsign?: string | null
          nome_cliente?: string
          observacoes?: string | null
          responsavel?: string
          status?: string
          status_assinatura?: string | null
          texto_contrato?: string
          updated_at?: string
          valor_causa?: number
          zapsign_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_settings: {
        Row: {
          auto_sync: boolean | null
          calendar_enabled: boolean | null
          calendar_id: string | null
          created_at: string
          id: string
          notification_enabled: boolean | null
          sync_direction: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          calendar_enabled?: boolean | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          notification_enabled?: boolean | null
          sync_direction?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          calendar_enabled?: boolean | null
          calendar_id?: string | null
          created_at?: string
          id?: string
          notification_enabled?: boolean | null
          sync_direction?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_sync_logs: {
        Row: {
          action: string
          agendamento_id: string | null
          created_at: string
          error_message: string | null
          google_event_id: string | null
          id: string
          status: string
          sync_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          agendamento_id?: string | null
          created_at?: string
          error_message?: string | null
          google_event_id?: string | null
          id?: string
          status: string
          sync_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          agendamento_id?: string | null
          created_at?: string
          error_message?: string | null
          google_event_id?: string | null
          id?: string
          status?: string
          sync_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_sync_logs_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope: string
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          area_juridica: string
          created_at: string
          email: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          origem: string
          responsavel: string
          status: string
          telefone: string | null
          updated_at: string
          valor_causa: number | null
        }
        Insert: {
          area_juridica: string
          created_at?: string
          email?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          origem: string
          responsavel: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor_causa?: number | null
        }
        Update: {
          area_juridica?: string
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          origem?: string
          responsavel?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          valor_causa?: number | null
        }
        Relationships: []
      }
      logs_atividades: {
        Row: {
          created_at: string
          data_hora: string
          descricao: string
          detalhes_adicionais: Json | null
          id: string
          ip_usuario: string | null
          modulo: string
          nome_usuario: string
          tipo_acao: Database["public"]["Enums"]["tipo_acao"]
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_hora?: string
          descricao: string
          detalhes_adicionais?: Json | null
          id?: string
          ip_usuario?: string | null
          modulo: string
          nome_usuario: string
          tipo_acao: Database["public"]["Enums"]["tipo_acao"]
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          descricao?: string
          detalhes_adicionais?: Json | null
          id?: string
          ip_usuario?: string | null
          modulo?: string
          nome_usuario?: string
          tipo_acao?: Database["public"]["Enums"]["tipo_acao"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_atividades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          ativo: boolean | null
          created_at: string
          created_by: string | null
          data_criacao: string
          id: string
          lido_por: string[] | null
          mensagem: string
          tipo: Database["public"]["Enums"]["notification_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          data_criacao?: string
          id?: string
          lido_por?: string[] | null
          mensagem: string
          tipo?: Database["public"]["Enums"]["notification_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          created_by?: string | null
          data_criacao?: string
          id?: string
          lido_por?: string[] | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["notification_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          created_at: string
          data_ultimo_acesso: string | null
          departamento: string | null
          email: string
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          data_ultimo_acesso?: string | null
          departamento?: string | null
          email: string
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          created_at?: string
          data_ultimo_acesso?: string | null
          departamento?: string | null
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          module: Database["public"]["Enums"]["app_module"]
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["app_module"]
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["app_module"]
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          ativo: boolean | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapsign_logs: {
        Row: {
          contrato_id: string | null
          created_at: string
          dados_evento: Json | null
          data_evento: string
          evento: string
          id: string
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string
          dados_evento?: Json | null
          data_evento?: string
          evento: string
          id?: string
        }
        Update: {
          contrato_id?: string | null
          created_at?: string
          dados_evento?: Json | null
          data_evento?: string
          evento?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapsign_logs_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stats_agentes_leads: {
        Row: {
          agente_id: string | null
          agente_nome: string | null
          total_leads_mes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_logs_atividades: {
        Args: {
          _limite?: number
          _offset?: number
          _usuario_id?: string
          _tipo_acao?: Database["public"]["Enums"]["tipo_acao"]
          _modulo?: string
          _data_inicio?: string
          _data_fim?: string
        }
        Returns: {
          id: string
          usuario_id: string
          nome_usuario: string
          tipo_acao: Database["public"]["Enums"]["tipo_acao"]
          modulo: string
          descricao: string
          data_hora: string
          ip_usuario: string
          detalhes_adicionais: Json
          total_count: number
        }[]
      }
      contar_nao_lidas: {
        Args: { user_id: string }
        Returns: number
      }
      get_user_calendar_settings: {
        Args: { user_id: string }
        Returns: {
          calendar_enabled: boolean
          auto_sync: boolean
          calendar_id: string
          sync_direction: string
          notification_enabled: boolean
        }[]
      }
      has_permission: {
        Args: {
          _user_id: string
          _module: Database["public"]["Enums"]["app_module"]
          _permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_google_token_expired: {
        Args: { user_id: string }
        Returns: boolean
      }
      marcar_notificacao_lida: {
        Args: { notificacao_id: string; user_id: string }
        Returns: boolean
      }
      marcar_todas_lidas: {
        Args: { user_id: string }
        Returns: number
      }
      registrar_log_atividade: {
        Args: {
          _usuario_id: string
          _nome_usuario: string
          _tipo_acao: Database["public"]["Enums"]["tipo_acao"]
          _modulo: string
          _descricao: string
          _ip_usuario?: string
          _detalhes_adicionais?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_module:
        | "leads"
        | "contratos"
        | "agendamentos"
        | "relatorios"
        | "configuracoes"
        | "whatsapp_ia"
        | "usuarios"
      app_permission: "create" | "read" | "update" | "delete" | "manage"
      app_role:
        | "administrador"
        | "advogado"
        | "comercial"
        | "pos_venda"
        | "suporte"
      notification_type: "info" | "alerta" | "sucesso" | "erro"
      status_integracao: "ativa" | "inativa" | "erro"
      tipo_acao:
        | "criacao"
        | "edicao"
        | "exclusao"
        | "login"
        | "logout"
        | "erro"
        | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_module: [
        "leads",
        "contratos",
        "agendamentos",
        "relatorios",
        "configuracoes",
        "whatsapp_ia",
        "usuarios",
      ],
      app_permission: ["create", "read", "update", "delete", "manage"],
      app_role: [
        "administrador",
        "advogado",
        "comercial",
        "pos_venda",
        "suporte",
      ],
      notification_type: ["info", "alerta", "sucesso", "erro"],
      status_integracao: ["ativa", "inativa", "erro"],
      tipo_acao: [
        "criacao",
        "edicao",
        "exclusao",
        "login",
        "logout",
        "erro",
        "outro",
      ],
    },
  },
} as const
