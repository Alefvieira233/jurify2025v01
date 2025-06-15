
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
}

export const useSupabaseQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  options: QueryOptions = {}
) => {
  const { enabled = true, refetchOnMount = true, staleTime = 30000 } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const executeQuery = useCallback(async () => {
    if (!user || !enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache validity
    const now = Date.now();
    if (!refetchOnMount && data.length > 0 && (now - lastFetch) < staleTime) {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 [${queryKey}] Iniciando query...`);
      const startTime = Date.now();
      
      const result = await queryFn();
      
      if (!mountedRef.current) return;

      const duration = Date.now() - startTime;
      console.log(`✅ [${queryKey}] Query concluída em ${duration}ms`);

      if (result.error) {
        throw result.error;
      }

      setData(result.data || []);
      setLastFetch(now);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ [${queryKey}] Erro na query:`, error);
      
      if (error.name !== 'AbortError') {
        const errorMessage = error.message || 'Erro ao carregar dados';
        setError(errorMessage);
        setData([]);
        
        toast({
          title: 'Erro ao carregar dados',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, enabled, queryKey, queryFn, refetchOnMount, staleTime, data.length, lastFetch, toast]);

  useEffect(() => {
    mountedRef.current = true;
    executeQuery();

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeQuery]);

  const refetch = useCallback(() => {
    setLastFetch(0); // Force refetch
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    isEmpty: !loading && data.length === 0,
  };
};
