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

// 🧹 LIMPEZA DE STORAGE ANTIGO (apenas dev, apenas uma vez por sessão)
if (import.meta.env.MODE === 'development') {
  const storageCleared = sessionStorage.getItem('jurify-storage-cleared-v1');
  if (!storageCleared) {
    console.log('🧹 Limpando tokens antigos do localStorage...');
    Object.keys(localStorage)
      .filter(key => key.startsWith('sb-') || key.includes('supabase'))
      .forEach(key => {
        localStorage.removeItem(key);
        console.log(`  🗑️ Removido: ${key}`);
      });
    sessionStorage.setItem('jurify-storage-cleared-v1', 'true');
    console.log('✅ Limpeza concluída. Sessão será persistida corretamente.');
  }
}

// ✅ CONFIGURAÇÃO CORRETA - SESSION PERSISTENCE ATIVADA
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // ✅ Sessão salva no localStorage
    autoRefreshToken: true,    // ✅ Token renovado automaticamente
    detectSessionInUrl: true,  // ✅ Detecta session em callback URLs
  },
  global: {
    headers: { 'x-application-name': 'jurify' },
  },
});

// ✅ Log de inicialização (apenas dev)
if (import.meta.env.MODE === 'development') {
  console.log('✅ Supabase client inicializado:', {
    url: supabaseUrl,
    mode: import.meta.env.MODE,
    config: 'persistSession=true, autoRefreshToken=true',
  });
}
