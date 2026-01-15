import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
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
  const sessionRef = useRef<Session | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    sessionRef.current = session;
    userRef.current = user;
  }, [session, user]);

  // Auto logout on inactivity without touching active sessions.
  useEffect(() => {
    if (!session) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let lastActivityTime = Date.now();

    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 60 minutes

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity >= INACTIVITY_LIMIT && !document.hidden) {
        console.log('[auth] Session expired due to inactivity');
        signOut();
        toast({
          title: 'Sessao expirada',
          description: 'Sua sessao foi encerrada por inatividade. Fa�a login novamente.',
          variant: 'destructive',
        });
      }
    };

    const resetActivity = () => {
      if (!document.hidden) {
        lastActivityTime = Date.now();

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(checkInactivity, INACTIVITY_LIMIT);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[auth] Tab visible again, keeping session');
      } else {
        console.log('[auth] Tab hidden, pausing inactivity timer');
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      document.addEventListener(event, resetActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetActivity();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach((event) => {
        document.removeEventListener(event, resetActivity);
      });
    };
  }, [session, toast]);

  const logSecurityEvent = async (eventType: 'login' | 'logout' | 'outro', description: string) => {
    if (user) {
      try {
        await supabase.rpc('registrar_log_atividade', {
          _usuario_id: user.id,
          _nome_usuario: user.email || 'Usuario',
          _tipo_acao: eventType,
          _modulo: 'Security',
          _descricao: description,
          _detalhes_adicionais: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip: 'client-side',
          },
        });
      } catch (error) {
        console.error('Failed to record security event:', error);
      }
    }
  };

  const clearAuthStorage = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key === 'supabase.auth.token') {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('sb-') || key === 'supabase.auth.token') {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear auth storage:', error);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [
      { met: password.length >= minLength, text: 'Minimo 12 caracteres' },
      { met: hasUpperCase, text: 'Uma letra maiuscula' },
      { met: hasLowerCase, text: 'Uma letra minuscula' },
      { met: hasNumbers, text: 'Um numero' },
      { met: hasSpecialChar, text: 'Um caractere especial' },
    ];

    const score = requirements.filter((req) => req.met).length;
    const isStrong = score >= 4;

    return { isStrong, requirements, score };
  };

  const hasRole = (role: string) => {
    return profile?.role === role || false;
  };

  const hasPermission = async (module: string, permission: string): Promise<boolean> => {
    if (!user || !profile) return false;

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

      return !error && !!data;
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
        console.error('Failed to load profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        console.log('[auth] Checking existing session');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[auth] Session error:', error.message);
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            console.warn('[auth] Invalid token detected, clearing session');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            return;
          }
          throw error;
        }

        if (session) {
          console.log('[auth] Valid session found:', session.user.email);
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
          setSentryUser(session.user);
        } else {
          console.log('[auth] No active session');
        }
      } catch (error) {
        console.error('[auth] Failed to get session:', error);
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
        console.log(`[auth] Event: ${event}`);

        if (event === 'TOKEN_REFRESHED') {
          console.log('[auth] Token refreshed');
          return;
        }

        if (event === 'SIGNED_OUT') {
          console.log('[auth] User signed out');
          setSession(null);
          setUser(null);
          setProfile(null);
          setSentryUser(null);
          return;
        }

        if (event === 'SIGNED_IN') {
          console.log('[auth] User signed in:', session?.user?.email);
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          await fetchProfile(session.user.id);
          setSentryUser(session.user);
        } else {
          setProfile(null);
          setSentryUser(null);
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
          logSecurityEvent(
            event === 'SIGNED_IN' ? 'login' : 'logout',
            event === 'SIGNED_IN' ? 'Usuario fez login' : 'Usuario saiu'
          ).catch((e) => console.warn('Security log failed:', e));
        }
      }
    );

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sb-') && e.newValue === null && userRef.current) {
        console.log('[auth] Logout detected in another tab, syncing');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await logSecurityEvent('outro', `Tentativa de login falhou para: ${email}`);
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const metadata = typeof userData === 'string' ? { full_name: userData } : userData;
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isStrong) {
        const missingReqs = passwordValidation.requirements
          .filter((req) => !req.met)
          .map((req) => req.text)
          .join(', ');

        throw new Error(`Senha nao atende aos requisitos: ${missingReqs}`);
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      logSecurityEvent('logout', 'Usuario encerrou sessao').catch((e) =>
        console.warn('Security log failed on logout:', e)
      );

      // Limpar estado local primeiro
      setSession(null);
      setUser(null);
      setProfile(null);
      setSentryUser(null);

      // Limpar sessao local imediatamente para evitar persistencia
      const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
      if (localError) {
        console.error('Erro ao fazer signOut local no Supabase:', localError);
      }

      // Tentar invalidar tokens no servidor sem bloquear o logout
      supabase.auth.signOut({ scope: 'global' }).catch((error) => {
        console.warn('Erro ao fazer signOut global no Supabase:', error);
      });

      clearAuthStorage();

      // Forcar redirecionamento para pagina de login
      window.location.replace('/auth');
    } catch (error) {
      console.error('Failed to sign out:', error);
      clearAuthStorage();
      // Mesmo com erro, forcar redirecionamento
      window.location.replace('/auth');
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
