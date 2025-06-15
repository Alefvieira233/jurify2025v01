
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Users, Shield, Edit, Trash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UsuariosPermissoesSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Buscar roles existentes
  const { data: roles = [] } = useQuery({
    queryKey: ['user-roles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role,
          user_id,
          profiles!inner(nome_completo, email)
        `)
        .eq('ativo', true);

      if (error) throw error;
      
      // Agrupar por role
      const roleGroups = data.reduce((acc: any, item) => {
        if (!acc[item.role]) {
          acc[item.role] = {
            role: item.role,
            users: []
          };
        }
        acc[item.role].users.push({
          id: item.user_id,
          nome: item.profiles.nome_completo,
          email: item.profiles.email
        });
        return acc;
      }, {});

      return Object.values(roleGroups);
    }
  });

  // Buscar permissões por role
  const { data: permissions = [] } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('ativo', true)
        .order('role');

      if (error) throw error;
      return data;
    }
  });

  const roles_list = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'advogado', label: 'Advogado' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'pos_venda', label: 'Pós-venda' },
    { value: 'suporte', label: 'Suporte' }
  ];

  const modules_list = [
    { value: 'leads', label: 'Leads' },
    { value: 'contratos', label: 'Contratos' },
    { value: 'agendamentos', label: 'Agendamentos' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'whatsapp_ia', label: 'WhatsApp IA' },
    { value: 'usuarios', label: 'Usuários' }
  ];

  const permissions_list = [
    { value: 'read', label: 'Visualizar' },
    { value: 'create', label: 'Criar' },
    { value: 'update', label: 'Editar' },
    { value: 'delete', label: 'Excluir' },
    { value: 'manage', label: 'Gerenciar' }
  ];

  const getRoleLabel = (role: string) => {
    return roles_list.find(r => r.value === role)?.label || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      administrador: 'bg-red-100 text-red-800',
      advogado: 'bg-blue-100 text-blue-800',
      comercial: 'bg-green-100 text-green-800',
      pos_venda: 'bg-yellow-100 text-yellow-800',
      suporte: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPermissionsForRole = (role: string) => {
    return permissions.filter(p => p.role === role);
  };

  return (
    <div className="space-y-6">
      {/* Gerenciamento de Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Roles de Usuário
          </CardTitle>
          <CardDescription>
            Visualize e gerencie as roles atribuídas aos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((roleGroup: any) => (
                <TableRow key={roleGroup.role}>
                  <TableCell>
                    <Badge className={getRoleColor(roleGroup.role)}>
                      {getRoleLabel(roleGroup.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {roleGroup.users.map((user: any) => (
                        <div key={user.id} className="text-sm">
                          <div className="font-medium">{user.nome}</div>
                          <div className="text-gray-500">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getPermissionsForRole(roleGroup.role).map((perm) => (
                        <Badge key={`${perm.module}-${perm.permission}`} variant="outline" className="text-xs">
                          {perm.module}: {perm.permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingRole(roleGroup);
                        setIsRoleDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo de Permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matriz de Permissões
          </CardTitle>
          <CardDescription>
            Visualização geral das permissões por role e módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Role</th>
                  {modules_list.map(module => (
                    <th key={module.value} className="text-center p-2 min-w-[120px]">
                      {module.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles_list.map(role => (
                  <tr key={role.value} className="border-b">
                    <td className="p-2">
                      <Badge className={getRoleColor(role.value)}>
                        {role.label}
                      </Badge>
                    </td>
                    {modules_list.map(module => {
                      const rolePermissions = permissions.filter(
                        p => p.role === role.value && p.module === module.value
                      );
                      return (
                        <td key={module.value} className="text-center p-2">
                          {rolePermissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {rolePermissions.map(perm => (
                                <Badge key={perm.permission} variant="secondary" className="text-xs">
                                  {perm.permission}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsuariosPermissoesSection;
