// CORREÇÃO DE SEGURANÇA: Usando variáveis de ambiente
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabaseClient } from './mock';

// Configuração segura usando variáveis de ambiente
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// 🧪 MODO MOCK para desenvolvimento sem backend
let client: any;

if (USE_MOCK) {
  console.warn('⚠️ [SUPABASE] Usando MOCK MODE - Dados simulados para desenvolvimento');
  client = mockSupabaseClient;
} else {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error(
      'Variáveis de ambiente do Supabase não configuradas. ' +
      'Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env'
    );
  }

  if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } else {
    // Fallback para evitar crash imediato se faltar env
    console.warn('⚠️ [SUPABASE] Fallback para mock devido a falta de credenciais');
    client = mockSupabaseClient;
  }
}

export const supabase = client;