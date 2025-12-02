
import { supabase } from '@/integrations/supabase/client';
import { AdminData } from './types';

export const createAdminUserInAuth = async (adminData: AdminData) => {
  console.log('🚀 Iniciando criação do usuário admin...');
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminData.email,
    password: adminData.password,
    email_confirm: true,
    user_metadata: {
      nome_completo: adminData.name
    }
  });

  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError);
    throw authError;
  }

  console.log('✅ Usuário criado no Auth:', authData.user?.id);
  return authData.user;
};

export const ensureUserProfile = async (userId: string, adminData: AdminData) => {
  // Aguardar um pouco para garantir que o trigger handle_new_user execute
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verificar se o perfil foi criado automaticamente
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar perfil:', profileError);
    throw profileError;
  }

  // Se o perfil não foi criado, criar manualmente
  if (!profileData) {
    console.log('📝 Criando perfil manualmente...');
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nome_completo: adminData.name,
        email: adminData.email,
        ativo: true
      });

    if (insertProfileError) {
      console.error('❌ Erro ao criar perfil:', insertProfileError);
      throw insertProfileError;
    }
  }
};

export const assignAdminRole = async (userId: string) => {
  const { error: roleError } = await supabase
    .from('user_roles')
    .update({ role: 'administrador', ativo: true })
    .eq('user_id', userId);

  if (roleError) {
    console.error('❌ Erro ao atualizar role:', roleError);
    // Tentar inserir se não existir
    const { error: insertRoleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'administrador',
        ativo: true
      });

    if (insertRoleError) {
      console.error('❌ Erro ao inserir role:', insertRoleError);
      throw insertRoleError;
    }
  }
};

export const performAutoLogin = async (adminData: AdminData) => {
  console.log('🔐 Fazendo login automático...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: adminData.email,
    password: adminData.password,
  });

  if (loginError) {
    console.error('❌ Erro no login automático:', loginError);
    throw loginError;
  }

  console.log('✅ Login automático bem-sucedido!');
  return loginData;
};

export const redirectToDashboard = () => {
  setTimeout(() => {
    window.location.href = '/?tab=dashboard';
  }, 2000);
};
