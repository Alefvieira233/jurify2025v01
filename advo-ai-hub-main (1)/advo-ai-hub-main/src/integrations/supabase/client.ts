/**
 * 🔒 SUPABASE CLIENT - DEFAULTS PUROS
 * ================================================
 * Cliente Supabase ultra-simplificado usando APENAS
 * configurações default do Supabase (mais estáveis).
 *
 * - Validação obrigatória de credenciais
 * - SEM configurações customizadas
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

// ✅ EMERGENCY CONFIG - O PULO DO GATO 🎯
// Desabilita session persistence para evitar timeout no auth.getSession()
// Isso resolve o problema de promises pendentes no localStorage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // <--- O PULO DO GATO
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'jurify-debug' },
  },
});

// ✅ Log de inicialização (apenas dev)
if (import.meta.env.MODE === 'development') {
  console.log('✅ Supabase client inicializado (EMERGENCY CONFIG):', {
    url: supabaseUrl,
    mode: import.meta.env.MODE,
    config: 'persistSession=false (timeout fix)',
  });
}
