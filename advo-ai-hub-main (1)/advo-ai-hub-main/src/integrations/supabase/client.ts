/**
 * 🔒 SUPABASE CLIENT - STRICT MODE (SEM MOCKS)
 * ================================================
 * Cliente Supabase refatorado para produção.
 * - Sem fallbacks ou mocks
 * - Falha imediata se credenciais ausentes
 * - Type-safe com Database schema
 * ================================================
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 VALIDAÇÃO OBRIGATÓRIA: Falha rápido se variáveis ausentes
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 FALHA CRÍTICA: Variáveis de ambiente do Supabase ausentes.');
  console.error('Verifique seu arquivo .env:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase URL e Anon Key são obrigatórios no .env');
}

// ✅ Criar cliente Supabase com configurações seguras
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Manter sessão entre reloads
    autoRefreshToken: true,       // Refresh automático de token
    detectSessionInUrl: true,     // Detectar token na URL (OAuth callbacks)
  },
  db: {
    schema: 'public',             // Schema padrão
  },
  global: {
    headers: {
      'x-application-name': 'jurify-frontend',
    },
  },
});

// ✅ Log de inicialização (apenas dev)
if (import.meta.env.MODE === 'development') {
  console.log('✅ Supabase client inicializado:', {
    url: supabaseUrl,
    mode: import.meta.env.MODE,
  });
}
