/**
 * ✅ CONFIRMAR EMAIL DO USUÁRIO DE TESTE
 *
 * Usa o service role key para confirmar o email do usuário teste@jurify.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function loadEnv() {
  const envContent = readFileSync('.env', 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) env[key.trim()] = value;
  });
  return env;
}

const env = loadEnv();

// Usar SERVICE ROLE KEY para ter privilégios de admin
// Chave fornecida pelo usuário: sb_secret_fLfBA6I3NbiCQv1VmYiBeQ_4wQgMyF-
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeGduY2JvcHZuc2x0anFldHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM2MjI1OSwiZXhwIjoyMDQ5OTM4MjU5fQ.WfaO9HM30SILaDjpXitkTSRwzwbYzd_LJRQRoJOdsBk';

const supabaseAdmin = createClient(
  env.VITE_SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('\n✅ CONFIRMANDO EMAIL DO USUÁRIO TESTE\n');
console.log('='.repeat(60));

async function confirmarEmail() {
  try {
    const userId = '47a76291-8093-4ed9-a87f-f37044a99846';

    console.log('📋 Confirmando email para usuário:', userId);
    console.log('   Email: teste@jurify.com\n');

    // Atualizar usuário para confirmar email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      console.error('❌ Erro ao confirmar email:', error.message);
      console.log('\n💡 Detalhes:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Email confirmado com sucesso!');
    console.log('   Usuário:', data.user.email);
    console.log('   Status:', data.user.email_confirmed_at ? 'CONFIRMADO' : 'PENDENTE');
    console.log('   ID:', data.user.id);
    console.log('\n🎉 Agora você pode fazer login com:');
    console.log('   Email: teste@jurify.com');
    console.log('   Senha: teste123\n');

  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message);
    console.error(err);
  }
}

confirmarEmail();
