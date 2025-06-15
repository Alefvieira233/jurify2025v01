
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgenteRequest {
  agente_id: string;
  input_usuario: string;
  use_n8n?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🤖 Agentes IA API - Iniciado');

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { agente_id, input_usuario, use_n8n = true }: AgenteRequest = await req.json();
    console.log('📦 Request recebido:', { agente_id, input_usuario, use_n8n });

    if (!agente_id || !input_usuario) {
      return new Response(JSON.stringify({ 
        error: 'agente_id e input_usuario são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar dados do agente
    const { data: agente, error: agenteError } = await supabaseClient
      .from('agentes_ia')
      .select('*')
      .eq('id', agente_id)
      .eq('status', 'ativo')
      .single();

    if (agenteError || !agente) {
      console.error('❌ Agente não encontrado:', agenteError);
      return new Response(JSON.stringify({ 
        error: 'Agente não encontrado ou inativo' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Agente encontrado:', agente.nome);

    // Se use_n8n for true, tentar enviar para N8N primeiro
    if (use_n8n) {
      console.log('🔗 Tentando enviar para N8N...');
      
      try {
        const n8nResponse = await supabaseClient.functions.invoke('n8n-webhook-forwarder', {
          body: {
            agente_id: agente.id,
            nome_agente: agente.nome,
            input_usuario,
            prompt_base: agente.prompt_base,
            parametros_avancados: agente.parametros_avancados,
            area_juridica: agente.area_juridica,
            tipo_agente: agente.tipo_agente
          }
        });

        if (n8nResponse.data?.success) {
          console.log('✅ N8N processou com sucesso');
          return new Response(JSON.stringify({
            success: true,
            source: 'n8n',
            response: n8nResponse.data.n8n_response,
            agente_nome: agente.nome,
            log_id: n8nResponse.data.log_id
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('⚠️ N8N falhou, executando localmente como fallback');
        }
      } catch (n8nError) {
        console.error('❌ Erro N8N, executando localmente:', n8nError);
      }
    }

    // Fallback: Processamento local com OpenAI
    console.log('🔄 Processando localmente com OpenAI...');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API Key não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar log de execução local
    const { data: logData, error: logError } = await supabaseClient
      .from('logs_execucao_agentes')
      .insert([{
        agente_id: agente.id,
        input_recebido: input_usuario,
        status: 'processing',
        n8n_status: use_n8n ? 'fallback' : 'disabled'
      }])
      .select()
      .single();

    const logId = logData?.id;

    // Preparar prompt para OpenAI
    const systemPrompt = `${agente.prompt_base}

Área Jurídica: ${agente.area_juridica}
Função: ${agente.descricao_funcao}
Objetivo: ${agente.objetivo}

${agente.perguntas_qualificacao?.length ? 
  `Perguntas de Qualificação: ${agente.perguntas_qualificacao.join(', ')}` : ''
}

${agente.keywords_acao?.length ? 
  `Palavras-chave de Ação: ${agente.keywords_acao.join(', ')}` : ''
}`;

    const openaiPayload = {
      model: agente.parametros_avancados?.modelo || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input_usuario }
      ],
      temperature: agente.parametros_avancados?.temperatura || 0.7,
      top_p: agente.parametros_avancados?.top_p || 0.9,
      frequency_penalty: agente.parametros_avancados?.frequency_penalty || 0,
      presence_penalty: agente.parametros_avancados?.presence_penalty || 0,
      max_tokens: agente.parametros_avancados?.max_tokens || 1000
    };

    const startTime = Date.now();

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiPayload),
      });

      const responseData = await openaiResponse.json();
      const executionTime = Date.now() - startTime;

      if (openaiResponse.ok) {
        const aiResponse = responseData.choices[0]?.message?.content || 'Resposta não disponível';
        
        // Atualizar log com sucesso
        if (logId) {
          await supabaseClient
            .from('logs_execucao_agentes')
            .update({
              resposta_ia: aiResponse,
              status: 'success',
              tempo_execucao: executionTime,
              api_key_usado: 'openai'
            })
            .eq('id', logId);
        }

        console.log('✅ Processamento local concluído');

        return new Response(JSON.stringify({
          success: true,
          source: 'local_openai',
          response: aiResponse,
          agente_nome: agente.nome,
          execution_time: executionTime,
          log_id: logId
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } else {
        throw new Error(`OpenAI Error: ${responseData.error?.message || 'Erro desconhecido'}`);
      }

    } catch (error) {
      console.error('❌ Erro no processamento local:', error);
      
      // Atualizar log com erro
      if (logId) {
        await supabaseClient
          .from('logs_execucao_agentes')
          .update({
            status: 'error',
            erro_detalhes: error.message,
            tempo_execucao: Date.now() - startTime
          })
          .eq('id', logId);
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Erro no processamento do agente IA',
        details: error.message,
        log_id: logId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
