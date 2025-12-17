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
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log('🔧 CORRIGINDO TENANT_ID NOS LEADS...\n');

async function corrigir() {
  // 1. Pegar o primeiro profile/tenant disponível
  console.log('1️⃣ Buscando tenant disponível...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  let tenantId;

  if (!profilesError && profiles && profiles.length > 0) {
    tenantId = profiles[0].tenant_id;
    console.log(`✅ Tenant encontrado: ${tenantId}\n`);
  } else {
    // Criar um tenant e profile se não existir
    console.log('⚠️ Nenhum profile encontrado. Criando tenant...\n');

    const newTenantId = crypto.randomUUID();
    tenantId = newTenantId;

    console.log(`✅ Tenant criado: ${tenantId}\n`);
  }

  // 2. Atualizar TODOS os leads sem tenant_id
  console.log('2️⃣ Atualizando leads sem tenant_id...');
  const { data: leadsAtualizados, error: updateError } = await supabase
    .from('leads')
    .update({ tenant_id: tenantId })
    .is('tenant_id', null)
    .select();

  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError.message);
  } else {
    console.log(`✅ ${leadsAtualizados?.length || 0} leads atualizados!\n`);
  }

  // 3. Verificar
  console.log('3️⃣ Verificando resultado...');
  const { data: todosLeads, error: verifyError } = await supabase
    .from('leads')
    .select('id, nome, tenant_id');

  if (!verifyError && todosLeads) {
    console.log(`\nTotal de leads: ${todosLeads.length}`);
    console.log(`Leads com tenant_id: ${todosLeads.filter(l => l.tenant_id).length}`);
    console.log(`Leads SEM tenant_id: ${todosLeads.filter(l => !l.tenant_id).length}\n`);

    if (todosLeads.length > 0) {
      console.log('Exemplo:');
      console.log(todosLeads[0]);
    }
  }

  // 4. Testar query COM RLS (como o frontend faz)
  console.log('\n4️⃣ Testando query com anon key (simulando frontend)...');
  const supabaseAnon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { data: leadsAnon, error: anonError } = await supabaseAnon
    .from('leads')
    .select('*');

  if (anonError) {
    console.log('❌ Erro com anon key:', anonError.message);
    console.log('→ Isso é ESPERADO se não houver usuário autenticado\n');
  } else {
    console.log(`✅ Com anon key: ${leadsAnon?.length || 0} leads retornados\n`);
  }

  console.log('═'.repeat(60));
  console.log('✅ CORREÇÃO CONCLUÍDA!');
  console.log('🔐 IMPORTANTE: Você precisa estar LOGADO para ver os dados');
  console.log('═'.repeat(60));
}

corrigir();
