
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { AdminData } from './admin/types';
import AdminUserForm from './admin/AdminUserForm';
import AdminSuccessDisplay from './admin/AdminSuccessDisplay';
import { 
  createAdminUserInAuth, 
  ensureUserProfile, 
  assignAdminRole, 
  performAutoLogin, 
  redirectToDashboard 
} from './admin/adminUserService';

const CreateAdminUser = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [adminData, setAdminData] = useState<AdminData>({
    email: 'admin@jurify.com',
    password: 'Jurify@Admin123',
    name: 'Administrador do Sistema'
  });

  const createAdminUser = async () => {
    setIsCreating(true);
    
    try {
      // 1. Criar usuário no Supabase Auth
      const user = await createAdminUserInAuth(adminData);
      
      // 2. Garantir que o perfil existe
      await ensureUserProfile(user!.id, adminData);
      
      // 3. Atribuir role de administrador
      await assignAdminRole(user!.id);
      
      console.log('🎉 Usuário admin criado com sucesso!');
      
      setAdminCreated(true);
      setAdminData(prev => ({ ...prev, userId: user!.id }));
      
      // 4. Fazer login automático
      await performAutoLogin(adminData);
      
      toast({
        title: "Usuário Administrador Criado e Logado!",
        description: `Login automático realizado. Redirecionando para o dashboard...`,
      });
      
      // 5. Redirecionar para o dashboard
      redirectToDashboard();

    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      toast({
        title: "Erro ao criar administrador",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (adminCreated) {
    return <AdminSuccessDisplay adminData={adminData} />;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Criar Usuário Administrador
        </CardTitle>
        <CardDescription>
          Criação do usuário admin@jurify.com com acesso total ao sistema e login automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AdminUserForm
          adminData={adminData}
          setAdminData={setAdminData}
          onCreateAdmin={createAdminUser}
          isCreating={isCreating}
        />
      </CardContent>
    </Card>
  );
};

export default CreateAdminUser;
