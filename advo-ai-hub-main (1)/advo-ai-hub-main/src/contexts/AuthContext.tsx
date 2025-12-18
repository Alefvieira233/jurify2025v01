
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setSentryUser } from '@/lib/sentry';

interface Profile {
  id: string;
  nome_completo: string;
  email: string;
  role?: string;
  tenant_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (module: string, permission: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Auto logout after 4 hours of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (session) {
        timeoutId = setTimeout(() => {
          signOut();
          toast({
            title: "Sessão Expirada",
            description: "Sua sessão foi encerrada por inatividade. Faça login novamente.",
            variant: "destructive",
          });
        }, 30 * 60 * 1000); // 30 minutes - LGPD compliant
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [session]);

  // Log security events
  const logSecurityEvent = async (eventType: 'login' | 'logout' | 'outro', description: string) => {
    if (user) {
      try {
        await supabase.rpc('registrar_log_atividade', {
          _usuario_id: user.id,
          _nome_usuario: user.email || 'Usuário',
          _tipo_acao: eventType,
          _modulo: 'Security',
          _descricao: description,
          _detalhes_adicionais: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip: 'client-side' // IP seria obtido do servidor
          }
        });
      } catch (error) {
        console.error('Erro ao registrar evento de segurança:', error);
      }
    }
  };

  // Validate password strength (simplified for better UX)
  const validatePassword = (password: string) => {
    const minLength = 6; // Reduzido de 8 para 6
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [
      { met: password.length >= minLength, text: 'Mínimo 6 caracteres' },
      { met: hasUpperCase, text: 'Uma letra maiúscula' },
      { met: hasLowerCase, text: 'Uma letra minúscula' },
      { met: hasNumbers, text: 'Um número' },
      { met: hasSpecialChar, text: 'Um caractere especial' }
    ];

    const score = requirements.filter(req => req.met).length;
    const isStrong = score >= 3; // Reduzido de 4 para 3 (mais flexível)

    return { isStrong, requirements, score };
  };

  // Helper functions for permissions
  const hasRole = (role: string) => {
    return profile?.role === role || false;
  };

  const hasPermission = async (module: string, permission: string): Promise<boolean> => {
    if (!user || !profile) return false;

    // Admin has all permissions
    if (profile.role === 'admin') return true;

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('resource', module)
        .eq('action', permission)
        .eq('tenant_id', profile.tenant_id)
        .single();

      return !error && data;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro de sessão:', error.message);
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
             // Limpeza forçada se o token estiver inválido/antigo
             await supabase.auth.signOut();
             setSession(null);
             setUser(null);
             setProfile(null);
             localStorage.clear(); // Garante que lixo antigo não atrapalhe
             return;
          }
          throw error;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
          // ✅ Configurar usuário no Sentry
          setSentryUser(session.user);
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
        // Em caso de erro fatal de sessão, limpa tudo
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 Auth Event: ${event}`);
        
        if (event === 'TOKEN_REFRESH_REVOKED') {
           console.warn('Token revogado, forçando logout');
           setSession(null);
           setUser(null);
           setProfile(null);
           return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        // Log events apenas se tivermos um user válido E perfil carregado (para evitar erros de RLS)
        if (session?.user && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
             // Log silencioso para não bloquear UX
             logSecurityEvent(
               event === 'SIGNED_IN' ? 'login' : 'logout', 
               event === 'SIGNED_IN' ? 'Usuário fez login' : 'Usuário saiu'
             ).catch(e => console.warn('Falha ao logar evento sec:', e));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logSecurityEvent('outro', `Tentativa de login falhada para: ${email}`);
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isStrong) {
        const missingReqs = passwordValidation.requirements
          .filter(req => !req.met)
          .map(req => req.text)
          .join(', ');

        throw new Error(`Senha não atende aos requisitos: ${missingReqs}`);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await logSecurityEvent('logout', 'Usuário encerrou sessão');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // ✅ Limpar usuário do Sentry
      setSentryUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
