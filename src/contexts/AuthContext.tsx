
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
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

  // Log de atividade direto para evitar dependência circular
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
      console.log('🔍 Buscando perfil para usuário:', userId);
      
      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        
        // Se não encontrar perfil, criar um básico
        if (profileError.code === 'PGRST116') {
          console.log('📝 Perfil não encontrado, criando novo...');
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
              console.log('✅ Novo perfil criado:', newProfile);
              setProfile(newProfile);
            } else {
              console.error('❌ Erro ao criar perfil:', createError);
              throw new Error('Falha ao criar perfil do usuário');
            }
          }
        } else {
          throw profileError;
        }
      } else if (profileData) {
        console.log('✅ Perfil encontrado:', profileData);
        setProfile(profileData);
      }

      // Buscar roles (opcional, não bloqueia acesso)
      console.log('🔍 Buscando roles do usuário...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true);

      if (rolesError) {
        console.error('❌ Erro ao buscar roles:', rolesError);
        setUserRoles([]);
      } else {
        console.log('✅ Roles encontradas:', rolesData);
        setUserRoles(rolesData || []);
      }
    } catch (error) {
      console.error('💥 Erro geral ao buscar perfil:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // 🔓 ACESSO TOTAL: Qualquer usuário autenticado tem todas as permissões
  const hasPermission = (module: string, permission: string): boolean => {
    return !!user; // Apenas verificar se está autenticado
  };

  // 🔓 ACESSO TOTAL: Qualquer usuário autenticado tem qualquer role
  const hasRole = (role: string): boolean => {
    return !!user; // Qualquer usuário autenticado tem qualquer role
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        throw error;
      }

      console.log('✅ Login bem-sucedido:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('💥 Erro no login:', error);
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
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    console.log('🚀 Inicializando AuthProvider...');

    // Configurar timeout de 10 segundos para autenticação
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('⏰ Timeout de autenticação atingido');
        setLoading(false);
        console.error('Timeout: Falha ao validar sessão em 10 segundos');
      }
    }, 10000);

    setAuthTimeout(timeout);

    // Configurar listener de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        // Limpar timeout se o estado mudar
        if (authTimeout) {
          clearTimeout(authTimeout);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário autenticado, buscando perfil...');
          try {
            await fetchProfile(session.user.id);
            console.log('✅ Perfil carregado com sucesso');
          } catch (error) {
            console.error('💥 Erro ao carregar perfil:', error);
            // Em caso de erro, ainda permite acesso mas com funcionalidade limitada
          } finally {
            setLoading(false);
          }
        } else {
          console.log('👤 Usuário não autenticado, limpando estado...');
          setProfile(null);
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        setLoading(false);
        return;
      }
      
      console.log('🔍 Session inicial verificada:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('🔄 Session existente encontrada, buscando perfil...');
        fetchProfile(session.user.id).then(() => {
          if (mounted) {
            console.log('✅ Inicialização completa');
            setLoading(false);
          }
        }).catch((error) => {
          console.error('💥 Erro na inicialização:', error);
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        console.log('🔍 Nenhuma session existente');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
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
