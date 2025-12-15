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

console.log('🔧 CORRIGINDO TENANT_ID - SOLUÇÃO SIMPLES\n');
console.log('═'.repeat(60));

async function corrigirTenantSimples() {
  try {
    // 1. PEGAR TENANT EXISTENTE
    console.log('\n1️⃣ Buscando tenant existente...');
    const { data: tenantsExistentes, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);

    let tenantId;

    if (tenantsExistentes && tenantsExistentes.length > 0) {
      tenantId = tenantsExistentes[0].id;
      console.log(`✅ Tenant encontrado: ${tenantId}`);
    } else {
      console.error('❌ Nenhum tenant encontrado. Criando um...');

      const newTenantId = crypto.randomUUID();
      const { error: createError } = await supabase
        .from('tenants')
        .insert({
          id: newTenantId,
          name: 'Jurify Demo',
          created_at: new Date().toISOString()
        });

      if (createError) {
        console.error('❌ Erro ao criar tenant:', createError.message);
        throw createError;
      }

      tenantId = newTenantId;
      console.log(`✅ Tenant criado: ${tenantId}`);
    }

    // 2. VERIFICAR USUÁRIOS AUTH
    console.log('\n2️⃣ Verificando usuários no Supabase Auth...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('⚠️ Erro ao listar usuários:', usersError.message);
    } else {
      console.log(`📊 Total de usuários: ${users?.length || 0}`);

      if (users && users.length > 0) {
        console.log('\n👤 Usuários encontrados:');
        users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`);
        });

        // Criar/atualizar profiles para cada usuário
        console.log('\n3️⃣ Criando/atualizando profiles...');
        for (const user of users) {
          const { data: profileExistente } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileExistente) {
            // Atualizar profile existente
            await supabase
              .from('profiles')
              .update({ tenant_id: tenantId })
              .eq('id', user.id);
            console.log(`   ✅ Profile atualizado: ${user.email}`);
          } else {
            // Criar novo profile
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                tenant_id: tenantId,
                email: user.email,
                role: 'admin',
                created_at: new Date().toISOString()
              });

            if (profileError) {
              console.log(`   ⚠️ Erro ao criar profile para ${user.email}:`, profileError.message);
            } else {
              console.log(`   ✅ Profile criado: ${user.email}`);
            }
          }
        }
      } else {
        console.log('\n⚠️ NENHUM USUÁRIO ENCONTRADO!');
        console.log('ℹ️  Você precisa criar um usuário primeiro:');
        console.log('   1. Acesse http://localhost:8080');
        console.log('   2. Clique em "Sign Up" e crie uma conta');
        console.log('   3. Execute este script novamente');
        console.log('\n⏭️  Por enquanto, vou apenas atualizar os leads com tenant_id...\n');
      }
    }

    // 3. ATUALIZAR LEADS COM TENANT_ID (SEMPRE FAZ ISSO)
    console.log('\n4️⃣ Atualizando leads com tenant_id...');
    const { data: leadsAtualizados, error: updateError } = await supabase
      .from('leads')
      .update({ tenant_id: tenantId })
      .is('tenant_id', null)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar leads:', updateError.message);
      throw updateError;
    }

    console.log(`✅ ${leadsAtualizados?.length || 0} leads atualizados!`);

    // 4. ATUALIZAR OUTRAS TABELAS
    console.log('\n5️⃣ Atualizando outras tabelas...');

    const tabelas = ['agendamentos', 'contratos', 'agentes_ia'];

    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .update({ tenant_id: tenantId })
          .is('tenant_id', null)
          .select();

        if (!error) {
          console.log(`   ✅ ${tabela}: ${data?.length || 0} registros atualizados`);
        } else {
          console.log(`   ⚠️ ${tabela}: ${error.message}`);
        }
      } catch (e) {
        console.log(`   ⚠️ ${tabela}: tabela pode não ter coluna tenant_id`);
      }
    }

    // 5. VERIFICAÇÃO FINAL
    console.log('\n' + '═'.repeat(60));
    console.log('📊 VERIFICAÇÃO FINAL:\n');

    const { data: todosLeads } = await supabase
      .from('leads')
      .select('id, nome, tenant_id, status');

    if (todosLeads) {
      console.log(`Total de leads: ${todosLeads.length}`);
      console.log(`Leads com tenant_id: ${todosLeads.filter(l => l.tenant_id).length}`);
      console.log(`Leads SEM tenant_id: ${todosLeads.filter(l => !l.tenant_id).length}`);

      if (todosLeads.length > 0) {
        console.log('\nExemplo de lead:');
        console.log(todosLeads[0]);
      }
    }

    const { count: agendamentosCount } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true });
    const { count: contratosCount } = await supabase.from('contratos').select('*', { count: 'exact', head: true });
    const { count: agentesCount } = await supabase.from('agentes_ia').select('*', { count: 'exact', head: true });

    console.log('\nTOTAIS:');
    console.log(`  Leads: ${todosLeads?.length || 0}`);
    console.log(`  Agendamentos: ${agendamentosCount || 0}`);
    console.log(`  Contratos: ${contratosCount || 0}`);
    console.log(`  Agentes IA: ${agentesCount || 0}`);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('\n🔐 IMPORTANTE PARA VER OS DADOS:');
    console.log('   1. Você PRECISA estar LOGADO na aplicação');
    console.log('   2. Acesse http://localhost:8080');
    console.log('   3. Faça login ou crie uma conta');
    console.log('   4. Execute este script novamente se criou conta nova');
    console.log('   5. Recarregue o Dashboard');
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

corrigirTenantSimples();
