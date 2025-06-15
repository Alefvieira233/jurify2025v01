
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityPolicy {
  id: string;
  name: string;
  category: 'data_protection' | 'access_control' | 'audit' | 'privacy';
  status: 'active' | 'inactive';
  description: string;
  lastUpdated: string;
}

export const useSecurityPolicies = () => {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const defaultPolicies: SecurityPolicy[] = [
    {
      id: 'rls-enforcement',
      name: 'Row Level Security Enforcement',
      category: 'data_protection',
      status: 'active',
      description: 'Garante que usuários só acessem seus próprios dados',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'session-timeout',
      name: 'Session Timeout',
      category: 'access_control',
      status: 'active',
      description: 'Sessões expiram automaticamente após período de inatividade',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'audit-logging',
      name: 'Audit Logging',
      category: 'audit',
      status: 'active',
      description: 'Todas as ações são registradas para auditoria',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'data-minimization',
      name: 'Data Minimization',
      category: 'privacy',
      status: 'active',
      description: 'Coleta apenas dados estritamente necessários',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'password-policy',
      name: 'Password Policy',
      category: 'access_control',
      status: 'active',
      description: 'Política de senhas fortes obrigatória',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'api-rate-limiting',
      name: 'API Rate Limiting',
      category: 'data_protection',
      status: 'active',
      description: 'Limitação de requisições para prevenir abuso',
      lastUpdated: new Date().toISOString()
    }
  ];

  const fetchPolicies = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Para este sistema, vamos usar políticas padrão já que não temos tabela específica
      // Em um sistema real, você poderia armazenar isso em uma tabela 'security_policies'
      setPolicies(defaultPolicies);
      
    } catch (error) {
      console.error('Erro ao buscar políticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as políticas de segurança.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateDataAccess = async (userId: string, tableName: string) => {
    try {
      // Verificar se o usuário tem permissão para acessar a tabela
      const { data, error } = await supabase
        .from(tableName as any)
        .select('count')
        .limit(1);

      if (error) {
        console.error('Acesso negado para tabela:', tableName, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro na validação de acesso:', error);
      return false;
    }
  };

  const logSecurityEvent = async (
    eventType: 'outro',
    description: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('registrar_log_atividade', {
        _usuario_id: user.id,
        _nome_usuario: user.email || 'Usuário',
        _tipo_acao: eventType,
        _modulo: 'Security',
        _descricao: `${eventType}: ${description}`,
        _detalhes_adicionais: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  };

  const checkPasswordStrength = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    return {
      score,
      strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong',
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const sanitizeInput = (input: string) => {
    // Remove caracteres potencialmente perigosos
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  const validateEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    fetchPolicies();
  }, [user]);

  return {
    policies,
    loading,
    fetchPolicies,
    validateDataAccess,
    logSecurityEvent,
    checkPasswordStrength,
    sanitizeInput,
    validateEmailFormat,
  };
};
