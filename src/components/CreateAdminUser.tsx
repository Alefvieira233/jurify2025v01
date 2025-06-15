
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

const CreateAdminUser = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [adminData, setAdminData] = useState({
    email: 'admin@jurify.com',
    password: 'Jurify@Admin123',
    name: 'Administrador do Sistema'
  });

  const createAdminUser = async () => {
    setIsCreating(true);
    
    try {
      console.log('🚀 Iniciando criação do usuário admin...');
      
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          nome_completo: adminData.name
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário:', authError);
        throw authError;
      }

      console.log('✅ Usuário criado no Auth:', authData.user?.id);

      // 2. Aguardar um pouco para garantir que o trigger handle_new_user execute
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Verificar se o perfil foi criado automaticamente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user!.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar perfil:', profileError);
        throw profileError;
      }

      // 4. Se o perfil não foi criado, criar manualmente
      if (!profileData) {
        console.log('📝 Criando perfil manualmente...');
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user!.id,
            nome_completo: adminData.name,
            email: adminData.email,
            ativo: true
          });

        if (insertProfileError) {
          console.error('❌ Erro ao criar perfil:', insertProfileError);
          throw insertProfileError;
        }
      }

      // 5. Atualizar role para administrador
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'administrador', ativo: true })
        .eq('user_id', authData.user!.id);

      if (roleError) {
        console.error('❌ Erro ao atualizar role:', roleError);
        // Tentar inserir se não existir
        const { error: insertRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user!.id,
            role: 'administrador',
            ativo: true
          });

        if (insertRoleError) {
          console.error('❌ Erro ao inserir role:', insertRoleError);
          throw insertRoleError;
        }
      }

      console.log('🎉 Usuário admin criado com sucesso!');
      
      setAdminCreated(true);
      setAdminData(prev => ({ ...prev, userId: authData.user!.id }));
      
      toast({
        title: "Usuário Administrador Criado!",
        description: `Admin criado com sucesso. ID: ${authData.user!.id}`,
      });

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
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Usuário Administrador Criado com Sucesso!
          </CardTitle>
          <CardDescription>
            O usuário administrador foi criado e configurado no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-green-800">Dados de Acesso:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>E-mail:</strong> {adminData.email}</p>
              <p><strong>Senha:</strong> {adminData.password}</p>
              <p><strong>Nome:</strong> {adminData.name}</p>
              {adminData.userId && (
                <p><strong>ID Supabase:</strong> {adminData.userId}</p>
              )}
              <p><strong>Role:</strong> Administrador</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">✅ Confirmações:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Usuário criado no Supabase Auth</li>
              <li>• Perfil criado na tabela profiles</li>
              <li>• Role definida como 'administrador'</li>
              <li>• Permissões de acesso total configuradas</li>
              <li>• Email confirmado automaticamente</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">📝 Observações:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Este usuário tem acesso total ao sistema</li>
              <li>• A senha pode ser alterada após o primeiro login</li>
              <li>• O usuário é permanente até remoção manual</li>
              <li>• Todos os demais usuários foram preservados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Criar Usuário Administrador
        </CardTitle>
        <CardDescription>
          Criação do usuário admin@jurify.com com acesso total ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">E-mail</label>
            <Input
              type="email"
              value={adminData.email}
              onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Senha Temporária</label>
            <Input
              type="text"
              value={adminData.password}
              onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Nome Completo</label>
            <Input
              type="text"
              value={adminData.name}
              onChange={(e) => setAdminData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🔧 O que será feito:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Criar usuário no Supabase Auth</li>
            <li>• Confirmar email automaticamente</li>
            <li>• Criar perfil na tabela profiles</li>
            <li>• Definir role como 'administrador'</li>
            <li>• Configurar permissões de acesso total</li>
          </ul>
        </div>

        <Button 
          onClick={createAdminUser} 
          disabled={isCreating || !adminData.email || !adminData.password}
          className="w-full"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Criando Administrador...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário Administrador
            </>
          )}
        </Button>

        {isCreating && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Aguarde... Criando usuário e configurando permissões.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateAdminUser;
