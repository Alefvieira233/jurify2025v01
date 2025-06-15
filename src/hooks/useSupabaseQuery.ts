
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
  retryCount?: number;
  retryDelay?: number;
}

export const useSupabaseQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  options: QueryOptions = {}
) => {
  const { 
    enabled = true, 
    refetchOnMount = true, 
    staleTime = 30000,
    retryCount = 2,
    retryDelay = 1000
  } = options;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeQuery = useCallback(async (isRetry = false) => {
    if (!user || !enabled) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache validity (skip for retries)
    if (!isRetry && !refetchOnMount && data.length > 0) {
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

    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();
    
    if (!isRetry) {
      setLoading(true);
      setError(null);
      setRetryAttempt(0);
    }

    try {
      console.log(`🔄 [${queryKey}] ${isRetry ? `Tentativa ${retryAttempt + 1}` : 'Iniciando query'}...`);
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
      setRetryAttempt(0);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ [${queryKey}] Erro na query:`, error);
      
      if (error.name !== 'AbortError') {
        // Retry logic
        if (retryAttempt < retryCount) {
          console.log(`🔄 [${queryKey}] Tentando novamente em ${retryDelay}ms (tentativa ${retryAttempt + 1}/${retryCount})`);
          setRetryAttempt(prev => prev + 1);
          
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              executeQuery(true);
            }
          }, retryDelay);
          return;
        }

        const errorMessage = error.message || 'Erro ao carregar dados';
        setError(errorMessage);
        setData([]);
        
        // Only show toast for final failure
        toast({
          title: 'Erro ao carregar dados',
          description: `${errorMessage} (após ${retryCount} tentativas)`,
          variant: 'destructive',
        });
      }
    } finally {
      if (mountedRef.current && !isRetry) {
        setLoading(false);
      }
    }
  }, [user, enabled, queryKey, queryFn, refetchOnMount, staleTime, data.length, lastFetch, toast, retryCount, retryDelay, retryAttempt]);

  useEffect(() => {
    mountedRef.current = true;
    executeQuery();

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [executeQuery]);

  const refetch = useCallback(() => {
    setLastFetch(0); // Force refetch
    setRetryAttempt(0); // Reset retry count
    executeQuery();
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
