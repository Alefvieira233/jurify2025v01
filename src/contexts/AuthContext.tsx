
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
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
        }, 4 * 60 * 60 * 1000); // 4 hours
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

  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [
      { met: password.length >= minLength, text: 'Mínimo 8 caracteres' },
      { met: hasUpperCase, text: 'Uma letra maiúscula' },
      { met: hasLowerCase, text: 'Uma letra minúscula' },
      { met: hasNumbers, text: 'Um número' },
      { met: hasSpecialChar, text: 'Um caractere especial' }
    ];

    const score = requirements.filter(req => req.met).length;
    const isStrong = score >= 4;

    return { isStrong, requirements, score };
  };

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          await logSecurityEvent('login', 'Usuário fez login no sistema');
        } else if (event === 'SIGNED_OUT') {
          await logSecurityEvent('logout', 'Usuário saiu do sistema');
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
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
