/**
 * 🔐 CONFIGURAR SECRET NO SUPABASE VIA API
 *
 * Usa a Management API do Supabase para configurar a OPENAI_API_KEY
 */

import { readFileSync } from 'fs';

const PROJECT_REF = 'yfxgncbopvnsltjqetxw';
const SERVICE_ROLE_KEY = 'sb_secret_fLfBA6I3NbiCQv1VmYiBeQ_4wQgMyF-';
const OPENAI_API_KEY = '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';

console.log('\n🔐 CONFIGURANDO SECRET NO SUPABASE\n');
console.log('='.repeat(60));
console.log('Project:', PROJECT_REF);
console.log('Secret:', 'OPENAI_API_KEY');
console.log('='.repeat(60));

async function configurarSecret() {
  try {
    // Endpoint da Management API do Supabase
    const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`;

    console.log('\n📡 Enviando secret para Supabase...\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'OPENAI_API_KEY',
        value: OPENAI_API_KEY
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ ERRO ao configurar secret:');
      console.error('   Status:', response.status);
      console.error('   Response:', responseText);

      if (response.status === 401 || response.status === 403) {
        console.log('\n⚠️  NOTA:');
        console.log('   A configuração de secrets via API pode requerer um Access Token');
        console.log('   específico do Supabase Management Console.\n');
        console.log('📋 SOLUÇÃO MANUAL:');
        console.log('   1. Acesse: https://supabase.com/dashboard/project/' + PROJECT_REF);
        console.log('   2. Vá em: Settings > Edge Functions');
        console.log('   3. Procure "Secrets" ou "Environment Variables"');
        console.log('   4. Adicione:');
        console.log('      Nome: OPENAI_API_KEY');
        console.log('      Valor: ' + OPENAI_API_KEY);
        console.log('\n   OU use a CLI do Supabase:');
        console.log('   npx supabase secrets set OPENAI_API_KEY=' + OPENAI_API_KEY + ' --project-ref ' + PROJECT_REF);
      }

      return false;
    }

    console.log('✅ SECRET CONFIGURADO COM SUCESSO!\n');
    console.log('Response:', responseText);
    console.log('\n⏳ Aguarde ~1 minuto para as Edge Functions atualizarem.\n');
    console.log('🎉 Agora os agentes IA funcionarão nas Edge Functions!\n');

    return true;

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error.message);

    console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
    console.log('\n   Como a API Key JÁ ESTÁ FUNCIONANDO localmente,');
    console.log('   você pode usar o sistema AGORA mesmo!\n');
    console.log('   As Edge Functions vão usar a variável do .env em desenvolvimento.\n');

    return false;
  }
}

configurarSecret();
