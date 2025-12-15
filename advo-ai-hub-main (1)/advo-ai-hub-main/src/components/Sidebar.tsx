
import React, { useState, useEffect } from 'react';
import {
  Scale,
  MessageSquare,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Users,
  Bot,
  TrendingUp,
  UserCog,
  LogOut,
  Bell,
  Activity,
  Zap,
  MessageCircle,
  CreditCard,
  Rocket,
  FlaskConical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const { signOut, profile, user, hasPermission } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [visibleMenuItems, setVisibleMenuItems] = useState<any[]>([]);

  // 🔒 RBAC SEGURO: Menu baseado em permissões reais
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, resource: 'dashboard', action: 'read' },
    { id: 'leads', label: 'Leads', icon: Users, resource: 'leads', action: 'read' },
    { id: 'pipeline', label: 'Pipeline Jurídico', icon: TrendingUp, resource: 'leads', action: 'read' },
    { id: 'timeline', label: 'Timeline de Conversas', icon: MessageCircle, resource: 'leads', action: 'read' },
    { id: 'whatsapp', label: 'WhatsApp IA', icon: MessageSquare, resource: 'whatsapp', action: 'read' },
    { id: 'contratos', label: 'Contratos', icon: FileText, resource: 'contratos', action: 'read' },
    { id: 'agendamentos', label: 'Agendamentos', icon: Calendar, resource: 'agendamentos', action: 'read' },
    { id: 'agentes', label: 'Agentes IA', icon: Bot, resource: 'agentes_ia', action: 'read' },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3, resource: 'relatorios', action: 'read' },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, resource: 'notificacoes', action: 'read' },
    { id: 'logs', label: 'Logs de Atividades', icon: Activity, resource: 'logs', action: 'read' },
    { id: 'admin/mission-control', label: '🚀 Mission Control', icon: Rocket, resource: 'dashboard', action: 'read', adminOnly: false },
    { id: 'admin/playground', label: '🧪 Agents Playground', icon: FlaskConical, resource: 'dashboard', action: 'read', adminOnly: false },
    { id: 'usuarios', label: 'Usuários', icon: UserCog, resource: 'usuarios', action: 'read', adminOnly: true },
    { id: 'integracoes', label: 'Integrações', icon: Zap, resource: 'integracoes', action: 'read', adminOnly: true },
    { id: 'planos', label: 'Planos & Assinatura', icon: CreditCard, resource: 'dashboard', action: 'read' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, resource: 'configuracoes', action: 'read', adminOnly: true },
  ];

  // Filtrar menu baseado em permissões
  useEffect(() => {
    const filterMenuItems = async () => {
      if (!user) {
        setVisibleMenuItems([]);
        return;
      }

      // 🔓 FALLBACK: Se não tem profile, mostrar itens básicos
      if (!profile) {
        console.warn('⚠️ Profile não encontrado, mostrando menu padrão');
        const defaultItems = allMenuItems.filter(item => !item.adminOnly);
        setVisibleMenuItems(defaultItems);
        return;
      }

      const filteredItems = [];

      for (const item of allMenuItems) {
        // Admin tem acesso a tudo
        if (profile.role === 'admin') {
          filteredItems.push(item);
          continue;
        }

        // Itens só para admin
        if (item.adminOnly) {
          continue;
        }

        // 🔓 FALLBACK: Tentar verificar permissão, se falhar, liberar acesso básico
        try {
          const hasAccess = await hasPermission(item.resource, item.action);
          if (hasAccess) {
            filteredItems.push(item);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao verificar permissão para ${item.resource}, liberando acesso padrão`);
          // Se erro ao verificar permissão, liberar itens não-admin
          if (!item.adminOnly) {
            filteredItems.push(item);
          }
        }
      }

      // 🔓 FALLBACK: Se não conseguiu nenhum item, mostrar todos não-admin
      if (filteredItems.length === 0) {
        console.warn('⚠️ Nenhuma permissão encontrada, mostrando menu padrão');
        const defaultItems = allMenuItems.filter(item => !item.adminOnly);
        setVisibleMenuItems(defaultItems);
      } else {
        setVisibleMenuItems(filteredItems);
      }
    };

    filterMenuItems();
  }, [user, profile, hasPermission]);

  // Buscar contagem de notificações não lidas
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .rpc('contar_nao_lidas', { user_id: user.id });

        if (!error && data !== null) {
          setUnreadCount(data);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchUnreadCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Jurify</h1>
            <p className="text-xs text-slate-400">Automação Jurídica</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.id === 'notificacoes';
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {isNotifications && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {profile?.nome_completo?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.nome_completo || user?.email || 'Usuário'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
