/**
 * RBAC (Role-Based Access Control) Types
 * Sistema de controle de acesso baseado em roles
 */

// Roles disponíveis no sistema
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

// Recursos do sistema
export type Resource =
  | 'leads'
  | 'contratos'
  | 'agentes_ia'
  | 'usuarios'
  | 'configuracoes'
  | 'relatorios'
  | 'logs'
  | 'integrações'
  | 'whatsapp'
  | 'agendamentos'
  | 'pipeline';

// Ações possíveis
export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';

// Permissão individual
export interface Permission {
  resource: Resource;
  actions: Action[];
}

// Matriz de permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin: Acesso total
  admin: [
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contratos', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'agentes_ia', actions: ['create', 'read', 'update', 'delete', 'execute'] },
    { resource: 'usuarios', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'configuracoes', actions: ['read', 'update', 'manage'] },
    { resource: 'relatorios', actions: ['read', 'create'] },
    { resource: 'logs', actions: ['read'] },
    { resource: 'integrações', actions: ['read', 'update', 'manage'] },
    { resource: 'whatsapp', actions: ['read', 'create', 'update'] },
    { resource: 'agendamentos', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
  ],

  // Manager: Pode gerenciar operações mas não usuários/configs
  manager: [
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contratos', actions: ['create', 'read', 'update'] },
    { resource: 'agentes_ia', actions: ['read', 'execute'] },
    { resource: 'usuarios', actions: ['read'] },
    { resource: 'configuracoes', actions: ['read'] },
    { resource: 'relatorios', actions: ['read', 'create'] },
    { resource: 'logs', actions: ['read'] },
    { resource: 'integrações', actions: ['read'] },
    { resource: 'whatsapp', actions: ['read', 'create'] },
    { resource: 'agendamentos', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
  ],

  // User: Operações básicas
  user: [
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'contratos', actions: ['read'] },
    { resource: 'agentes_ia', actions: ['read', 'execute'] },
    { resource: 'usuarios', actions: ['read'] },
    { resource: 'configuracoes', actions: ['read'] },
    { resource: 'relatorios', actions: ['read'] },
    { resource: 'logs', actions: [] },
    { resource: 'integrações', actions: [] },
    { resource: 'whatsapp', actions: ['read'] },
    { resource: 'agendamentos', actions: ['create', 'read', 'update'] },
    { resource: 'pipeline', actions: ['read'] },
  ],

  // Viewer: Somente leitura
  viewer: [
    { resource: 'leads', actions: ['read'] },
    { resource: 'contratos', actions: ['read'] },
    { resource: 'agentes_ia', actions: ['read'] },
    { resource: 'usuarios', actions: [] },
    { resource: 'configuracoes', actions: [] },
    { resource: 'relatorios', actions: ['read'] },
    { resource: 'logs', actions: [] },
    { resource: 'integrações', actions: [] },
    { resource: 'whatsapp', actions: ['read'] },
    { resource: 'agendamentos', actions: ['read'] },
    { resource: 'pipeline', actions: ['read'] },
  ],
};

// Labels amigáveis para roles
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador',
};

// Descrições dos roles
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total ao sistema, incluindo gerenciamento de usuários e configurações',
  manager: 'Pode gerenciar operações e leads, mas não usuários ou configurações',
  user: 'Acesso às funcionalidades básicas de leads e agentes',
  viewer: 'Acesso somente leitura ao sistema',
};
