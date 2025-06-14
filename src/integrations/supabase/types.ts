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
    },
  },
} as const
