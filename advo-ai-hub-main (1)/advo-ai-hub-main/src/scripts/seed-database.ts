/**
 * 🌱 JURIFY SEED SCRIPT - DADOS REALISTAS PARA TESTE
 *
 * Este script popula o banco de dados com dados realistas para validação do produto.
 *
 * Como executar:
 * 1. Via código: import e chame seedDatabase()
 * 2. Via console do navegador: window.seedDatabase()
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// =========================================================================
// DADOS REALISTAS
// =========================================================================

const AREAS_JURIDICAS = [
  'Trabalhista',
  'Civil',
  'Família',
  'Previdenciário',
  'Consumidor',
  'Criminal',
  'Empresarial'
];

const LEADS_SEED = [
  {
    nome: 'João Silva Santos',
    email: 'joao.silva@email.com',
    telefone: '(11) 98765-4321',
    mensagem_inicial: 'Fui demitido sem justa causa e a empresa não pagou minhas verbas rescisórias. Tenho FGTS e aviso prévio atrasados há 2 meses.',
    area_juridica: 'Trabalhista',
    status: 'novo_lead',
    origem: 'whatsapp'
  },
  {
    nome: 'Maria Oliveira Costa',
    email: 'maria.oliveira@email.com',
    telefone: '(21) 97654-3210',
    mensagem_inicial: 'Comprei um produto defeituoso e a loja se recusa a fazer a troca. Já tentei resolver amigavelmente mas não obtive retorno.',
    area_juridica: 'Consumidor',
    status: 'em_qualificacao',
    origem: 'site'
  },
  {
    nome: 'Carlos Eduardo Ferreira',
    email: 'carlos.ferreira@email.com',
    telefone: '(31) 96543-2109',
    mensagem_inicial: 'Preciso entrar com processo de divórcio consensual. Temos bens a partilhar e dois filhos menores.',
    area_juridica: 'Família',
    status: 'proposta_enviada',
    origem: 'indicacao'
  },
  {
    nome: 'Ana Paula Rodrigues',
    email: 'ana.rodrigues@email.com',
    telefone: '(41) 95432-1098',
    mensagem_inicial: 'Minha aposentadoria foi negada pelo INSS mesmo tendo contribuído por 32 anos. Preciso recorrer administrativamente.',
    area_juridica: 'Previdenciário',
    status: 'contrato_assinado',
    origem: 'whatsapp'
  },
  {
    nome: 'Pedro Henrique Lima',
    email: 'pedro.lima@email.com',
    telefone: '(51) 94321-0987',
    mensagem_inicial: 'Sofri acidente de trânsito e o motorista culpado não quer arcar com os danos materiais e médicos. Tenho boletim de ocorrência.',
    area_juridica: 'Civil',
    status: 'em_atendimento',
    origem: 'site'
  },
  {
    nome: 'Juliana Martins Souza',
    email: 'juliana.souza@email.com',
    telefone: '(61) 93210-9876',
    mensagem_inicial: 'Preciso abrir uma empresa MEI mas não sei como proceder com a documentação fiscal e contábil.',
    area_juridica: 'Empresarial',
    status: 'novo_lead',
    origem: 'google'
  },
  {
    nome: 'Roberto Carlos Alves',
    email: 'roberto.alves@email.com',
    telefone: '(71) 92109-8765',
    mensagem_inicial: 'Fui vítima de calúnia e difamação nas redes sociais. Tenho prints das publicações. Quero processar por danos morais.',
    area_juridica: 'Civil',
    status: 'lead_perdido',
    origem: 'whatsapp'
  },
  {
    nome: 'Fernanda Costa Ribeiro',
    email: 'fernanda.ribeiro@email.com',
    telefone: '(81) 91098-7654',
    mensagem_inicial: 'Banco negou meu empréstimo consignado alegando restrições que não existem. Preciso revisar minha situação cadastral.',
    area_juridica: 'Consumidor',
    status: 'em_qualificacao',
    origem: 'indicacao'
  },
  {
    nome: 'Lucas Gabriel Pereira',
    email: 'lucas.pereira@email.com',
    telefone: '(85) 90987-6543',
    mensagem_inicial: 'Trabalhei 8 anos com carteira assinada mas nunca recebi hora extra. Fazia rotineiramente 10h por dia. Quero receber retroativo.',
    area_juridica: 'Trabalhista',
    status: 'proposta_enviada',
    origem: 'site'
  },
  {
    nome: 'Beatriz Helena Santos',
    email: 'beatriz.santos@email.com',
    telefone: '(91) 99876-5432',
    mensagem_inicial: 'Preciso regularizar pensão alimentícia. O pai dos meus filhos não paga há 6 meses e está desempregado.',
    area_juridica: 'Família',
    status: 'novo_lead',
    origem: 'whatsapp'
  }
];

const AGENTES_SEED = [
  {
    nome: 'Coordenador',
    tipo: 'coordenador',
    descricao: 'Orquestra o fluxo de trabalho entre os agentes',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 2000,
      temperature: 0.3
    }
  },
  {
    nome: 'Qualificador',
    tipo: 'qualificador',
    descricao: 'Analisa e qualifica leads jurídicos',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 1500,
      temperature: 0.4
    }
  },
  {
    nome: 'Juridico',
    tipo: 'juridico',
    descricao: 'Valida viabilidade jurídica e precedentes',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 2500,
      temperature: 0.2
    }
  },
  {
    nome: 'Comercial',
    tipo: 'comercial',
    descricao: 'Cria propostas comerciais personalizadas',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 2000,
      temperature: 0.5
    }
  },
  {
    nome: 'Comunicador',
    tipo: 'comunicador',
    descricao: 'Formata mensagens para diferentes canais',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 1000,
      temperature: 0.6
    }
  },
  {
    nome: 'Analista',
    tipo: 'analista',
    descricao: 'Analisa performance e gera insights',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 1500,
      temperature: 0.3
    }
  },
  {
    nome: 'CustomerSuccess',
    tipo: 'customer_success',
    descricao: 'Gerencia onboarding e sucesso do cliente',
    status: 'ativo',
    configuracao: {
      model: 'gpt-4-turbo-preview',
      max_tokens: 1500,
      temperature: 0.5
    }
  }
];

// =========================================================================
// FUNÇÕES DE SEED
// =========================================================================

export async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  const startTime = Date.now();

  // Timeout de segurança: 15 segundos
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Tempo limite excedido (15s). Verifique sua conexão.')), 15000)
  );

  try {
    const seedTask = async () => {
      // 1. Verificar autenticação (usando getSession que é mais rápido e local)
      console.log('🔒 Verificando sessão...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError || !session?.user) {
        throw new Error('Usuário não autenticado. Faça login primeiro.');
      }

      const user = session.user;
      console.log('✅ Usuário autenticado:', user.email);

      // 2. Buscar ou criar tenant_id
      console.log('🏢 Buscando Tenant ID...');
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      let tenantId = profile?.tenant_id;

      if (!tenantId) {
        console.log('⚠️ Tenant ID não encontrado, criando novo...');
        tenantId = crypto.randomUUID();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ tenant_id: tenantId })
          .eq('id', user.id);
        
        if (updateError) console.warn('Falha ao atualizar profile:', updateError);
        console.log('✅ Novo Tenant ID definido:', tenantId);
      } else {
        console.log('✅ Tenant ID encontrado:', tenantId);
      }

      // 4. Inserir agentes IA
      console.log('🤖 Inserindo agentes IA...');
      
      let agentesInseridos: any[] = [];
      try {
          const agentesComTenant = AGENTES_SEED.map(agente => ({
              ...agente,
              tenant_id: tenantId,
              created_at: new Date().toISOString()
          }));

          const { data, error } = await supabase
              .from('agentes_ia')
              .upsert(agentesComTenant, { onConflict: 'nome,tenant_id' })
              .select();
          
          if (error) {
             console.warn('⚠️ Aviso ao inserir agentes:', error.message);
          } else {
             agentesInseridos = data || [];
             console.log(`✅ ${agentesInseridos.length} agentes inseridos`);
          }
      } catch (err: any) {
          console.error('⚠️ Falha não fatal ao criar agentes:', err.message);
      }

      // 5. Inserir leads
      console.log('👥 Inserindo leads...');
      
      let leadsInseridos: any[] = [];
      try {
          const leadsComTenant = LEADS_SEED.map((lead, index) => ({
              ...lead,
              tenant_id: tenantId,
              created_at: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000).toISOString()
          }));

          const { data, error } = await supabase
              .from('leads')
              .insert(leadsComTenant)
              .select();

          if (error) throw error;
          leadsInseridos = data || [];
          console.log(`✅ ${leadsInseridos.length} leads inseridos`);
      } catch (err: any) {
          console.error('⚠️ Falha ao criar leads:', err.message);
          throw new Error(`Erro crítico ao criar leads: ${err.message}`);
      }

      // 6. Criar logs de execução simulados (New Schema)
      if (leadsInseridos.length > 0) {
        console.log('📊 Gerando logs de execução (New Schema)...');

        try {
            const executions: any[] = [];
            const aiLogs: any[] = [];

            leadsInseridos.forEach(lead => {
              const numExecucoes = Math.floor(Math.random() * 3) + 2; 
              const agentesParaUso = agentesInseridos.length > 0 ? agentesInseridos : [{ nome: 'Agente Padrão' }];

              for (let i = 0; i < numExecucoes; i++) {
                const agenteAleatorio = agentesParaUso[Math.floor(Math.random() * agentesParaUso.length)];
                const statusAleatorio = Math.random() > 0.2 ? 'completed' : 'failed';
                
                const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                const executionUUID = crypto.randomUUID();

                executions.push({
                  id: executionUUID,
                  execution_id: executionId,
                  lead_id: lead.id,
                  tenant_id: tenantId,
                  user_id: user.id,
                  status: statusAleatorio,
                  current_agent: agenteAleatorio.nome,
                  current_stage: 'processing_complete',
                  started_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                  total_duration_ms: Math.floor(Math.random() * 5000) + 1000,
                  agents_involved: [agenteAleatorio.nome],
                  total_agents_used: 1,
                  total_tokens: Math.floor(Math.random() * 1000) + 500,
                  estimated_cost_usd: (Math.random() * 0.05 + 0.01).toFixed(4),
                  created_at: new Date().toISOString()
                });

                aiLogs.push({
                  execution_id: executionUUID,
                  agent_name: agenteAleatorio.nome,
                  lead_id: lead.id,
                  tenant_id: tenantId,
                  user_id: user.id,
                  model: 'gpt-4-turbo-preview',
                  status: statusAleatorio,
                  prompt_tokens: Math.floor(Math.random() * 500) + 100,
                  completion_tokens: Math.floor(Math.random() * 500) + 100,
                  total_tokens: Math.floor(Math.random() * 1000) + 500,
                  latency_ms: Math.floor(Math.random() * 3000) + 500,
                  result_preview: JSON.stringify({ action: 'processed', confidence: 0.9 }),
                  created_at: new Date().toISOString()
                });
              }
            });

            // Tentar inserir nas tabelas novas
            const { error: execError } = await supabase.from('agent_executions').insert(executions);
            
            if (execError) {
               console.warn('⚠️ Erro ao inserir agent_executions (tabela existe?):', execError.message);
               // Tentar fallback antigo se falhar
               console.log('🔄 Tentando fallback para logs_execucao_agentes...');
               const oldLogs = executions.map(e => ({
                  lead_id: e.lead_id,
                  tenant_id: e.tenant_id,
                  agente_id: agentesInseridos.length > 0 ? agentesInseridos[0].id : null, 
                  status: e.status === 'completed' ? 'success' : 'error',
                  prompt_usado: 'Seed Legacy',
                  resposta_gerada: '{}',
                  tokens_usados: e.total_tokens,
                  custo_estimado: e.estimated_cost_usd,
                  tempo_execucao_ms: e.total_duration_ms
               }));
               await supabase.from('logs_execucao_agentes').insert(oldLogs);
            } else {
               // Se execuções funcionaram, inserir logs
               await supabase.from('agent_ai_logs').insert(aiLogs);
               console.log(`✅ Execuções e Logs criados com sucesso`);
            }

        } catch (err: any) {
            console.error('⚠️ Erro não-fatal ao criar logs:', err.message);
        }
      }

      const leadsComContrato = leadsInseridos?.filter(l =>
        l.status === 'contrato_assinado' || l.status === 'em_atendimento'
      ) || [];

      if (leadsComContrato.length > 0) {
        console.log('📝 Criando contratos...');
        const contratos = leadsComContrato.map(lead => ({
          lead_id: lead.id,
          tenant_id: tenantId,
          tipo_contrato: 'consultoria_juridica',
          status_assinatura: lead.status === 'contrato_assinado' ? 'assinado' : 'pendente',
          valor_total: (Math.random() * 5000 + 2000).toFixed(2),
          forma_pagamento: ['boleto', 'pix', 'cartao'][Math.floor(Math.random() * 3)],
          created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString()
        }));

        const { data: contratosInseridos, error: contratosError } = await supabase
          .from('contratos')
          .insert(contratos)
          .select();

        if (contratosError) {
          console.warn('⚠️ Erro ao inserir contratos:', contratosError.message);
        } else {
          console.log(`✅ ${contratosInseridos?.length || 0} contratos criados`);
        }
      }

      // 8. Criar agendamentos
      console.log('📅 Criando agendamentos...');

      const agendamentos = leadsInseridos?.slice(0, 5).map(lead => ({
        lead_id: lead.id,
        tenant_id: tenantId,
        titulo: `Consulta - ${lead.nome}`,
        data_hora: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        duracao_minutos: 60,
        status: 'confirmado',
        tipo: 'consulta_inicial',
        created_at: new Date().toISOString()
      })) || [];

      if (agendamentos.length > 0) {
        const { data: agendamentosInseridos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .insert(agendamentos)
          .select();

        if (agendamentosError) {
          console.warn('⚠️ Erro ao inserir agendamentos:', agendamentosError.message);
        } else {
          console.log(`✅ ${agendamentosInseridos?.length || 0} agendamentos criados`);
        }
      }

      console.log(`\n🎉 SEED CONCLUÍDO em ${(Date.now() - startTime) / 1000}s!`);
      
      return {
        success: true,
        summary: {
          agentes: AGENTES_SEED.length,
          leads: LEADS_SEED.length,
          contratos: leadsComContrato.length,
          agendamentos: agendamentos.length
        }
      };
    };

    // Corrida entre a tarefa e o timeout
    return await Promise.race([seedTask(), timeoutPromise]);

  } catch (error: any) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

// Expor função globalmente para console do navegador
if (typeof window !== 'undefined') {
  (window as any).seedDatabase = seedDatabase;
}

// =========================================================================
// FUNÇÃO PARA LIMPAR DADOS (USE COM CUIDADO!)
// =========================================================================

export async function clearTestData() {
  console.log('🗑️ ATENÇÃO: Removendo dados de teste...');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const tenantId = profile?.tenant_id;

  if (!tenantId) {
    throw new Error('Tenant ID não encontrado');
  }

  // Remover em ordem (por causa das foreign keys)
  await supabase.from('agendamentos').delete().eq('tenant_id', tenantId);
  await supabase.from('contratos').delete().eq('tenant_id', tenantId);
  await supabase.from('logs_execucao_agentes').delete().eq('tenant_id', tenantId);
  await supabase.from('agent_executions').delete().eq('tenant_id', tenantId); // New Schema
  await supabase.from('leads').delete().eq('tenant_id', tenantId);

  console.log('✅ Dados de teste removidos');
  console.log('💡 Os agentes IA foram mantidos (remova manualmente se necessário)');

  return { success: true };
}

// Expor função globalmente apenas no cliente para console
if (typeof window !== 'undefined') {
  (window as any).seedDatabase = seedDatabase;
  (window as any).clearTestData = clearTestData;
}
