
export interface SidebarProps {
  activeTab: 'dashboard' | 'leads' | 'agendamentos' | 'contratos' | 'relatorios' | 'whatsapp' | 'usuarios' | 'configuracoes';
  onTabChange: (tab: 'dashboard' | 'leads' | 'agendamentos' | 'contratos' | 'relatorios' | 'whatsapp' | 'usuarios' | 'configuracoes') => void;
  onLogout: () => Promise<void>;
  userProfile: {
    id: string;
    nome_completo: string;
    email: string;
    cargo?: string;
    departamento?: string;
    telefone?: string;
    ativo: boolean;
    data_ultimo_acesso?: string;
    created_at: string;
    updated_at: string;
  };
  hasPermission: (module: string, permission: string) => boolean;
}
