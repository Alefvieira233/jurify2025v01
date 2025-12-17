#!/usr/bin/env node
/**
 * Script para aplicar dados fictícios no Supabase
 * Executa o SQL DADOS_FICTICIOS_TESTE.sql no banco de dados
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env
function loadEnv() {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
    const env = {};

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();

      if (key && value) {
        env[key.trim()] = value;
      }
    });

    return env;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://yfxgncbopvnsltjqetxw.supabase.co';
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_fLfBA6I3NbiCQv1VmYiBeQ_4wQgMyF-';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySQLFile() {
  console.log('🚀 Aplicando dados fictícios no Supabase...\n');

  try {
    // Ler arquivo SQL
    const sqlPath = join(__dirname, 'DADOS_FICTICIOS_TESTE.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📖 Arquivo SQL lido com sucesso');
    console.log(`📊 Tamanho: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Como não podemos executar SQL arbitrário via Supabase client,
    // vamos inserir dados via API diretamente

    console.log('⚠️  Nota: Usando API do Supabase para inserir dados\n');
    console.log('Para executar SQL completo, use o Supabase Dashboard > SQL Editor\n');

    // Dados de teste simplificados
    const testData = {
      leads: [
        {
          name: 'João Silva',
          email: 'joao.silva@teste.jurify.com',
          phone: '+5511999998888',
          status: 'novo',
          area_juridica: 'trabalhista',
          origem: 'whatsapp',
          descricao_caso: 'Questão sobre rescisão contratual'
        },
        {
          name: 'Maria Santos',
          email: 'maria.santos@teste.jurify.com',
          phone: '+5511988887777',
          status: 'qualificado',
          area_juridica: 'civel',
          origem: 'site',
          descricao_caso: 'Ação de cobrança'
        },
        {
          name: 'Pedro Oliveira',
          email: 'pedro.oliveira@teste.jurify.com',
          phone: '+5511977776666',
          status: 'proposta',
          area_juridica: 'criminal',
          origem: 'indicacao',
          descricao_caso: 'Defesa em processo'
        }
      ]
    };

    console.log('📝 Inserindo leads de teste...\n');

    const { data: insertedLeads, error: leadsError } = await supabase
      .from('leads')
      .insert(testData.leads)
      .select();

    if (leadsError) {
      console.error('❌ Erro ao inserir leads:', leadsError.message);
    } else {
      console.log(`✅ ${insertedLeads.length} leads inseridos com sucesso!\n`);

      // Mostrar leads inseridos
      insertedLeads.forEach((lead, i) => {
        console.log(`   ${i + 1}. ${lead.name} (${lead.area_juridica})`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // Verificar dados inseridos
    console.log('\n🔍 Verificando dados no banco...\n');

    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de Leads: ${leadsCount || 0}`);

    const { count: agendamentosCount } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de Agendamentos: ${agendamentosCount || 0}`);

    const { count: contratosCount } = await supabase
      .from('contratos')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de Contratos: ${contratosCount || 0}`);

    const { count: executionsCount } = await supabase
      .from('agent_executions')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de Execuções de Agentes: ${executionsCount || 0}`);

    const { count: logsCount } = await supabase
      .from('agent_ai_logs')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de Logs de IA: ${logsCount || 0}\n`);

    console.log('='.repeat(60));
    console.log('\n✅ Dados de teste aplicados!');
    console.log('🌐 Acesse http://localhost:8080 para ver o dashboard\n');

  } catch (error) {
    console.error('❌ Erro ao aplicar dados:', error);
    process.exit(1);
  }
}

// Executar
applySQLFile().catch(console.error);
