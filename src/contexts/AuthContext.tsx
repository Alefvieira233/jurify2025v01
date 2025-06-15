
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: UserRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null, error: any }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (module: string, permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct logging function to avoid circular dependency
  const logActivity = async (
    tipo_acao: 'login' | 'logout',
    descricao: string
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('registrar_log_atividade', {
        _usuario_id: user.id,
        _nome_usuario: user.email || 'Usuário',
        _tipo_acao: tipo_acao,
        _modulo: 'Autenticação',
        _descricao: descricao,
        _ip_usuario: null,
        _detalhes_adicionais: null,
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para usuário:', userId);
      
      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        
        // Se não encontrar perfil, criar um básico
        if (profileError.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo...');
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                nome_completo: userData.user.email || 'Usuário',
                email: userData.user.email || '',
                ativo: true
              })
              .select()
              .single();
            
            if (!createError && newProfile) {
              console.log('Novo perfil criado:', newProfile);
              setProfile(newProfile);
            } else {
              console.error('Erro ao criar perfil:', createError);
            }
          }
        }
      } else if (profileData) {
        console.log('Perfil encontrado:', profileData);
        setProfile(profileData);
      }

      // Buscar roles
      console.log('Buscando roles do usuário...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        
        // Se não encontrar roles, atribuir role padrão
        console.log('Roles não encontradas, criando role padrão...');
        const { data: newRole, error: insertRoleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'suporte',
            ativo: true
          })
          .select()
          .single();
        
        if (!insertRoleError && newRole) {
          console.log('Role padrão criada:', newRole);
          setUserRoles([newRole]);
        } else {
          console.error('Erro ao criar role padrão:', insertRoleError);
          setUserRoles([]);
        }
      } else {
        console.log('Roles encontradas:', rolesData);
        setUserRoles(rolesData || []);
      }
    } catch (error) {
      console.error('Erro geral ao buscar perfil:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const hasPermission = (module: string, permission: string): boolean => {
    if (!user || !userRoles.length) return false;
    
    // Admins têm acesso total
    if (userRoles.some(role => role.role === 'administrador')) return true;
    
    // Implementar verificação de permissões baseada nas roles
    // Esta é uma verificação simplificada - em produção, use a função do banco
    return userRoles.length > 0;
  };

  const hasRole = (role: string): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Iniciando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      console.log('Login bem-sucedido:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: nomeCompleto
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Registrar log de logout antes de fazer logout
      if (user) {
        await logActivity('logout', `Usuário ${user.email} fez logout`);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Limpar estado
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRoles([]);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile data for authenticated user
          console.log('Usuário autenticado, buscando perfil...');
          await fetchProfile(session.user.id);
        } else {
          console.log('Usuário não autenticado, limpando estado...');
          setProfile(null);
          setUserRoles([]);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Session inicial verificada:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Session existente encontrada, buscando perfil...');
        fetchProfile(session.user.id).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        console.log('Nenhuma session existente');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    userRoles,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    hasRole,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
