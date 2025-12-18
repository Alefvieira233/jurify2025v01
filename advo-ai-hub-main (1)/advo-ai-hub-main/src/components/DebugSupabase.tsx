/**
 * 🔍 DEBUG SUPABASE - SMOKE TEST COMPONENT
 * ================================================
 * Componente de debug que monitora a conexão com Supabase
 * em tempo real. Exibe status fixo no canto inferior direito.
 *
 * USAR APENAS EM DESENVOLVIMENTO!
 * ================================================
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  status: string;
  color: string;
  icon: string;
  details?: string;
}

export default function DebugSupabase() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: '🔍 Testando conexão Supabase...',
    color: 'orange',
    icon: '🔄',
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Get session (verifica auth)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setConnectionStatus({
            status: `❌ ERRO AUTH: ${sessionError.message}`,
            color: 'red',
            icon: '❌',
            details: sessionError.message,
          });
          return;
        }

        // Test 2: Simple query (verifica database)
        const { error: dbError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          // PGRST116 = no rows, mas conexão ok
          setConnectionStatus({
            status: `⚠️ DB ERROR: ${dbError.message}`,
            color: 'yellow',
            icon: '⚠️',
            details: dbError.message,
          });
          return;
        }

        // ✅ Tudo ok!
        const url = import.meta.env.VITE_SUPABASE_URL;
        const truncatedUrl = url ? `${url.slice(0, 30)}...` : 'N/A';

        setConnectionStatus({
          status: `✅ CONECTADO`,
          color: 'green',
          icon: '✅',
          details: `URL: ${truncatedUrl} | Session: ${sessionData.session ? 'Active' : 'None'}`,
        });
      } catch (error: any) {
        setConnectionStatus({
          status: `🔴 ERRO CRÍTICO: ${error.message}`,
          color: 'red',
          icon: '🔴',
          details: error.message,
        });
      }
    };

    // Testar imediatamente
    testConnection();

    // Re-testar a cada 10 segundos
    const interval = setInterval(testConnection, 10000);

    return () => clearInterval(interval);
  }, []);

  // Não renderizar em produção
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        padding: '12px 16px',
        background: '#1a1a1a',
        color: connectionStatus.color,
        zIndex: 9999,
        border: `2px solid ${connectionStatus.color}`,
        borderRadius: 8,
        fontWeight: 'bold',
        fontSize: '13px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        maxWidth: '400px',
        cursor: 'pointer',
      }}
      onClick={() => {
        console.log('🔍 Supabase Connection Status:', connectionStatus);
      }}
      title="Clique para ver detalhes no console"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{connectionStatus.icon}</span>
        <span>{connectionStatus.status}</span>
      </div>
      {connectionStatus.details && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#888',
            borderTop: '1px solid #333',
            paddingTop: '6px',
          }}
        >
          {connectionStatus.details}
        </div>
      )}
    </div>
  );
}
