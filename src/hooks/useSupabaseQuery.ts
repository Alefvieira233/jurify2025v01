
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
  const hasExecutedRef = useRef(false);

  const executeQuery = useCallback(async (force = false) => {
    // Prevent multiple executions
    if (!user || !enabled || (!force && hasExecutedRef.current && !refetchOnMount)) {
      return;
    }

    // Check cache validity (only skip if not forcing and data exists)
    if (!force && data.length > 0) {
      const now = Date.now();
      if ((now - lastFetch) < staleTime) {
        console.log(`📋 [${queryKey}] Cache válido, usando dados em cache`);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    hasExecutedRef.current = true;

    try {
      console.log(`🔄 [${queryKey}] Executando query...`);
      const startTime = Date.now();
      
      const result = await queryFn();
      
      if (!mountedRef.current) return;

      const duration = Date.now() - startTime;
      console.log(`✅ [${queryKey}] Query concluída em ${duration}ms`);

      if (result.error) {
        throw result.error;
      }

      setData(result.data || []);
      setLastFetch(Date.now());
      setError(null);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ [${queryKey}] Erro na query:`, error);
      
      if (error.name !== 'AbortError') {
        const errorMessage = error.message || 'Erro ao carregar dados';
        setError(errorMessage);
        setData([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, enabled, queryKey, queryFn, refetchOnMount, staleTime, data.length, lastFetch]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (user && enabled && !hasExecutedRef.current) {
      executeQuery();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, enabled]); // Simplified dependencies

  const refetch = useCallback(() => {
    hasExecutedRef.current = false;
    executeQuery(true);
  }, [executeQuery]);

  const mutate = useCallback((newData: T[]) => {
    setData(newData);
    setLastFetch(Date.now());
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    isEmpty: !loading && !error && data.length === 0,
    isStale: (Date.now() - lastFetch) > staleTime,
  };
};
