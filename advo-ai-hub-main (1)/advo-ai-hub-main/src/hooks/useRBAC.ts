import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Resource, Action, ROLE_PERMISSIONS } from '@/types/rbac';

/**
 * Hook para verificação de permissões RBAC
 *
 * @example
 * const { can, canManageUsers, isAdmin } = useRBAC();
 *
 * if (can('usuarios', 'delete')) {
 *   // Mostrar botão de deletar usuário
 * }
 */
export const useRBAC = () => {
  const { user, profile } = useAuth();

  // Role do usuário (default: viewer se não especificado)
  const userRole: UserRole = (profile?.role as UserRole) || 'viewer';

  /**
   * Verifica se o usuário tem permissão para uma ação em um recurso
   * @param resource - Recurso a ser verificado
   * @param action - Ação a ser verificada
   * @returns true se o usuário tem permissão
   */
  const can = (resource: Resource, action: Action): boolean => {
    // Usuário não autenticado não tem permissões
    if (!user || !profile) {
      return false;
    }

    // Buscar permissões do role
    const permissions = ROLE_PERMISSIONS[userRole];

    // Encontrar permissão para o recurso
    const resourcePermission = permissions.find(p => p.resource === resource);

    // Verificar se a ação está permitida
    return resourcePermission?.actions.includes(action) ?? false;
  };

  /**
   * Verifica se o usuário pode realizar QUALQUER ação no recurso
   * @param resource - Recurso a ser verificado
   * @returns true se o usuário tem alguma permissão no recurso
   */
  const canAccessResource = (resource: Resource): boolean => {
    if (!user || !profile) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[userRole];
    const resourcePermission = permissions.find(p => p.resource === resource);

    return (resourcePermission?.actions.length ?? 0) > 0;
  };

  /**
   * Verifica se o usuário pode realizar TODAS as ações especificadas
   * @param resource - Recurso a ser verificado
   * @param actions - Lista de ações a serem verificadas
   * @returns true se o usuário tem todas as permissões
   */
  const canAll = (resource: Resource, actions: Action[]): boolean => {
    return actions.every(action => can(resource, action));
  };

  /**
   * Verifica se o usuário pode realizar ALGUMA das ações especificadas
   * @param resource - Recurso a ser verificado
   * @param actions - Lista de ações a serem verificadas
   * @returns true se o usuário tem pelo menos uma permissão
   */
  const canAny = (resource: Resource, actions: Action[]): boolean => {
    return actions.some(action => can(resource, action));
  };

  // Atalhos convenientes para verificações comuns
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isUser = userRole === 'user';
  const isViewer = userRole === 'viewer';

  // Permissões específicas (atalhos comuns)
  const canManageUsers = can('usuarios', 'manage');
  const canDeleteUsers = can('usuarios', 'delete');
  const canManageConfig = can('configuracoes', 'manage');
  const canViewLogs = can('logs', 'read');
  const canExecuteAgents = can('agentes_ia', 'execute');
  const canManageIntegrations = can('integrações', 'manage');

  return {
    // Verificadores
    can,
    canAccessResource,
    canAll,
    canAny,

    // Role checks
    userRole,
    isAdmin,
    isManager,
    isUser,
    isViewer,

    // Atalhos comuns
    canManageUsers,
    canDeleteUsers,
    canManageConfig,
    canViewLogs,
    canExecuteAgents,
    canManageIntegrations,

    // Dados do usuário
    user,
    profile,
  };
};

// Hook alternativo para uso em componentes que precisam apenas de verificação simples
export const usePermission = (resource: Resource, action: Action): boolean => {
  const { can } = useRBAC();
  return can(resource, action);
};
