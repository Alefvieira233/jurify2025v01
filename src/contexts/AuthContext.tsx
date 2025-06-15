
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
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Configurações de segurança
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  const ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

  // Log de atividade com validação de segurança
  const logActivity = async (
    tipo_acao: 'login' | 'logout' | 'security',
    descricao: string
  ) => {
    if (!user) return;

    try {
      // Sanitizar descrição
      const sanitizedDescription = descricao
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim();

      await supabase.rpc('registrar_log_atividade', {
        _usuario_id: user.id,
        _nome_usuario: user.email || 'Usuário',
        _tipo_acao: tipo_acao,
        _modulo: 'Autenticação',
        _descricao: sanitizedDescription,
        _ip_usuario: null,
        _detalhes_adicionais: null,
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  // Monitorar atividade do usuário para timeout de sessão
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // Verificar timeout de sessão
  const checkSessionTimeout = () => {
    if (user && Date.now() - lastActivity > SESSION_TIMEOUT) {
      console.log('🕐 Sessão expirada por inatividade');
      logActivity('logout', 'Sessão expirada por inatividade');
      signOut();
    }
  };

  // Validar força da senha
  const validatePasswordStrength = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil para usuário:', userId);
      
      // Log de acesso a dados
      await logActivity('security', 'Acesso a dados do perfil do usuário');
      
      // Buscar perfil com validação de RLS
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
        
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
              await logActivity('security', 'Novo perfil de usuário criado');
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

      // Buscar roles com validação de RLS
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
      await logActivity('security', `Erro ao buscar perfil: ${error}`);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Sistema robusto de permissões baseado em roles
  const hasPermission = (module: string, permission: string): boolean => {
    if (!user || !userRoles.length) return false;
    
    // Verificar se o usuário tem uma role que permite a ação
    const hasValidRole = userRoles.some(userRole => {
      if (!userRole.ativo) return false;
      
      // Administradores têm acesso total
      if (userRole.role === 'administrador') return true;
      
      // Verificações específicas por role e módulo
      switch (userRole.role) {
        case 'advogado':
          return ['leads', 'contratos', 'agendamentos', 'relatorios', 'whatsapp_ia'].includes(module);
        case 'comercial':
          return ['leads', 'relatorios'].includes(module) || 
                 (module === 'contratos' && ['create', 'read'].includes(permission));
        case 'pos_venda':
          return ['agendamentos', 'contratos'].includes(module) || 
                 (module === 'leads' && permission === 'read');
        case 'suporte':
          return permission === 'read';
        default:
          return false;
      }
    });

    // Log de acesso a permissões
    if (hasValidRole) {
      logActivity('security', `Permissão concedida: ${module}:${permission}`);
    } else {
      logActivity('security', `Permissão negada: ${module}:${permission}`);
    }

    return hasValidRole;
  };

  const hasRole = (role: string): boolean => {
    return userRoles.some(userRole => userRole.role === role && userRole.ativo);
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando login para:', email);
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido');
      }

      // Sanitizar inputs
      const sanitizedEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        await logActivity('security', `Tentativa de login falhada para: ${sanitizedEmail}`);
        throw error;
      }

      console.log('✅ Login bem-sucedido:', data.user?.email);
      updateActivity(); // Marcar atividade
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('💥 Erro no login:', error);
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return { 
        error: { 
          message: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos' 
        } 
      };
    }

    // Sanitizar inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = nomeCompleto.replace(/[<>]/g, '').trim();

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: sanitizedName
        }
      }
    });

    if (!error) {
      await logActivity('security', `Nova conta criada para: ${sanitizedEmail}`);
    }

    return { error };
  };

  const signOut = async () => {
    try {
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
      setLastActivity(Date.now());
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    console.log('🚀 Inicializando AuthProvider...');

    // Configurar timeout de autenticação
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('⏰ Timeout de autenticação atingido');
        setLoading(false);
        console.error('Timeout: Falha ao validar sessão em 10 segundos');
      }
    }, 10000);

    setAuthTimeout(timeout);

    // Configurar listeners de atividade
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => updateActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar timeout de sessão periodicamente
    const sessionInterval = setInterval(checkSessionTimeout, ACTIVITY_CHECK_INTERVAL);

    // Configurar listener de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        if (authTimeout) {
          clearTimeout(authTimeout);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Usuário autenticado, buscando perfil...');
          updateActivity(); // Marcar atividade no login
          
          if (event === 'SIGNED_IN') {
            await logActivity('login', `Usuário ${session.user.email} fez login`);
          }
          
          try {
            await fetchProfile(session.user.id);
            console.log('✅ Perfil carregado com sucesso');
          } catch (error) {
            console.error('💥 Erro ao carregar perfil:', error);
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
        updateActivity();
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
      clearInterval(sessionInterval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
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
