/**
 * 🎯 TESTE MISSION CONTROL - REALTIME
 *
 * Testa se o Mission Control recebe updates em tempo real
 */

import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

console.log('\n🎯 TESTE MISSION CONTROL - REALTIME\n');
console.log('='.repeat(60));

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

async function testar() {
  const resultados = [];
  let subscription = null;

  try {
    console.log('📋 Carregando configurações...\n');
    const env = loadEnv();

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const anonKey = env.VITE_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, anonKey);

    // ========================================
    // TESTE 1: Conectar ao Realtime
    // ========================================
    console.log('1️⃣ Conectando ao Realtime...\n');

    let realtimeConnected = false;
    let updateRecebido = false;
    let latenciaRealtime = null;

    try {
      // Criar canal para agent_executions
      const channel = supabase
        .channel('mission-control-test')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_executions'
          },
          (payload) => {
            const tempoUpdate = Date.now();
            updateRecebido = true;
            latenciaRealtime = tempoUpdate - startExecTime;

            console.log('\n   🔔 UPDATE RECEBIDO VIA REALTIME!');
            console.log(`      Latência: ${latenciaRealtime}ms`);
            console.log(`      Evento: ${payload.eventType}`);
            console.log(`      Dados:`, JSON.stringify(payload.new, null, 2).substring(0, 200) + '...\n');
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            realtimeConnected = true;
            console.log('✅ Subscrito ao canal agent_executions\n');
          }
        });

      subscription = channel;

      // Aguardar conexão (max 5s)
      let tentativas = 0;
      while (!realtimeConnected && tentativas < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        tentativas++;
      }

      if (!realtimeConnected) {
        console.error('❌ Timeout ao conectar no Realtime\n');
        resultados.push({ teste: 'Conectar Realtime', status: 'FALHOU', erro: 'Timeout' });
        return false;
      }

      resultados.push({ teste: 'Conectar Realtime', status: 'OK' });

    } catch (err) {
      console.error(`❌ Erro ao conectar: ${err.message}\n`);
      resultados.push({ teste: 'Conectar Realtime', status: 'FALHOU', erro: err.message });
      return false;
    }

    // ========================================
    // TESTE 2: Executar agente
    // ========================================
    console.log('2️⃣ Executando agente IA...\n');

    // Buscar agente
    const { data: agentes } = await supabase
      .from('agentes_ia')
      .select('*')
      .eq('ativo', true)
      .limit(1);

    if (!agentes || agentes.length === 0) {
      console.error('❌ Nenhum agente encontrado\n');
      return false;
    }

    const agente = agentes[0];
    console.log(`   Agente: ${agente.nome}\n`);

    // Marcar tempo de execução
    const startExecTime = Date.now();

    // Chamar Edge Function
    const { data: response, error: execError } = await supabase.functions.invoke('agentes-ia-api', {
      body: {
        agente_id: agente.id,
        input_usuario: 'Teste de Mission Control - tempo real',
        use_n8n: false
      }
    });

    const execDuration = Date.now() - startExecTime;

    if (execError) {
      console.error(`❌ Erro na execução: ${execError.message}\n`);
      resultados.push({ teste: 'Executar agente', status: 'FALHOU', erro: execError.message });
      return false;
    }

    console.log(`✅ Agente executado em ${execDuration}ms\n`);
    resultados.push({ teste: 'Executar agente', status: 'OK', duracao: `${execDuration}ms` });

    // ========================================
    // TESTE 3: Aguardar update realtime
    // ========================================
    console.log('3️⃣ Aguardando update via Realtime...\n');
    console.log('   (aguardando até 5 segundos)\n');

    // Aguardar até 5s pelo update
    let aguardou = 0;
    while (!updateRecebido && aguardou < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100));
      aguardou += 100;

      // Mostrar progresso
      if (aguardou % 1000 === 0) {
        console.log(`   ⏳ Aguardando... ${aguardou / 1000}s`);
      }
    }

    if (!updateRecebido) {
      console.log('\n⚠️  Update NÃO recebido via Realtime\n');
      console.log('💡 Possíveis causas:');
      console.log('   1. Realtime não habilitado na tabela agent_executions');
      console.log('   2. RLS bloqueando inserts (Edge Function não conseguiu criar registro)');
      console.log('   3. Configuração de Realtime no Supabase Dashboard\n');

      resultados.push({ teste: 'Receber update', status: 'FALHOU', erro: 'Timeout - sem update' });
    } else {
      console.log(`✅ Update recebido com sucesso!\n`);
      resultados.push({ teste: 'Receber update', status: 'OK', latencia: `${latenciaRealtime}ms` });

      // ========================================
      // TESTE 4: Validar latência
      // ========================================
      console.log('4️⃣ Validando latência do Realtime...\n');

      if (latenciaRealtime < 1000) {
        console.log(`✅ Latência EXCELENTE: ${latenciaRealtime}ms (<1s)\n`);
        resultados.push({ teste: 'Latência Realtime', status: 'EXCELENTE', latencia: `${latenciaRealtime}ms` });
      } else if (latenciaRealtime < 2000) {
        console.log(`✅ Latência BOA: ${latenciaRealtime}ms (<2s)\n`);
        resultados.push({ teste: 'Latência Realtime', status: 'OK', latencia: `${latenciaRealtime}ms` });
      } else {
        console.log(`⚠️  Latência ALTA: ${latenciaRealtime}ms (>2s)\n`);
        resultados.push({ teste: 'Latência Realtime', status: 'LENTA', latencia: `${latenciaRealtime}ms` });
      }
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('='.repeat(60));
    console.log('📊 RESUMO DO TESTE\n');

    const totalTestes = resultados.length;
    const testesOK = resultados.filter(r => r.status === 'OK' || r.status === 'EXCELENTE').length;
    const testesFalhos = resultados.filter(r => r.status === 'FALHOU').length;
    const testesAtencao = resultados.filter(r => r.status === 'LENTA').length;

    resultados.forEach((r, i) => {
      const icon = r.status === 'OK' || r.status === 'EXCELENTE' ? '✅' : r.status === 'FALHOU' ? '❌' : '⚠️';
      console.log(`${icon} ${r.teste}: ${r.status}`);
      if (r.erro) console.log(`   Erro: ${r.erro}`);
      if (r.duracao) console.log(`   Duração: ${r.duracao}`);
      if (r.latencia) console.log(`   Latência: ${r.latencia}`);
    });

    console.log('\n' + '='.repeat(60));

    if (testesFalhos === 0 && testesAtencao === 0) {
      console.log('\n🎉 MISSION CONTROL FUNCIONANDO EM TEMPO REAL!\n');
      console.log('✅ Realtime conectado');
      console.log('✅ Updates sendo recebidos');
      console.log('✅ Latência excelente\n');
    } else if (testesFalhos === 0) {
      console.log('\n✅ MISSION CONTROL FUNCIONANDO!\n');
      console.log(`⚠️  ${testesAtencao} teste(s) com latência alta\n`);
    } else {
      console.log(`\n⚠️  ${testesFalhos}/${totalTestes} teste(s) falharam\n`);
      console.log('💡 Verifique:');
      console.log('   1. Realtime habilitado no Supabase Dashboard');
      console.log('   2. RLS permitindo inserts em agent_executions');
      console.log('   3. Edge Functions conseguindo criar registros\n');
    }

    // Limpar subscription
    if (subscription) {
      await subscription.unsubscribe();
    }

    // Salvar relatório
    const relatorio = `# Relatório de Teste - Mission Control Realtime

**Data:** ${new Date().toLocaleString('pt-BR')}

## Resultados

${resultados.map((r, i) => `### ${i + 1}. ${r.teste}
- **Status:** ${r.status}
${r.erro ? `- **Erro:** ${r.erro}` : ''}
${r.duracao ? `- **Duração:** ${r.duracao}` : ''}
${r.latencia ? `- **Latência:** ${r.latencia}` : ''}
`).join('\n')}

## Resumo
- Total: ${totalTestes}
- Sucesso: ${testesOK}
- Falhas: ${testesFalhos}
- Atenção: ${testesAtencao}
- Taxa de sucesso: ${Math.round((testesOK / totalTestes) * 100)}%

${testesFalhos === 0 ? '## ✅ Resultado: MISSION CONTROL FUNCIONANDO!' : '## ⚠️ Resultado: CORREÇÕES NECESSÁRIAS'}

## Próximos Passos

${testesFalhos === 0 ? 'Mission Control está operacional e recebendo updates em tempo real!' : `1. Habilite Realtime na tabela agent_executions no Dashboard
2. Verifique se RLS permite inserts via service role
3. Execute este teste novamente`}
`;

    writeFileSync('RELATORIO_TESTE_MISSION_CONTROL.md', relatorio);
    console.log('📄 Relatório salvo em: RELATORIO_TESTE_MISSION_CONTROL.md\n');

    return testesFalhos === 0;

  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message);
    console.error(err);
    return false;
  } finally {
    // Garantir que subscription é fechada
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        // Ignorar erros ao desinscrever
      }
    }
  }
}

testar();
