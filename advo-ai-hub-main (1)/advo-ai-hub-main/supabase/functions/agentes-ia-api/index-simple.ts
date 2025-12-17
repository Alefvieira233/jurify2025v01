import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = Date.now();

  console.log(`🤖 [Agentes API] Request iniciado`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parsear request
    const { agente_id, input_usuario, use_n8n = false } = await req.json();

    if (!agente_id || !input_usuario) {
      return new Response(
        JSON.stringify({ error: 'agente_id e input_usuario são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [Agentes API] Buscando agente: ${agente_id}`);

    // Buscar dados do agente
    const { data: agente, error: agenteError } = await supabaseClient
      .from('agentes_ia')
      .select('*')
      .eq('id', agente_id)
      .eq('ativo', true)
      .single();

    if (agenteError || !agente) {
      console.error('❌ [Agentes API] Agente não encontrado:', agenteError);
      return new Response(
        JSON.stringify({ error: 'Agente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [Agentes API] Agente encontrado: ${agente.nome}`);

    // Criar log inicial
    const { data: logData } = await supabaseClient
      .from('logs_execucao_agentes')
      .insert({
        agente_id,
        input_recebido: input_usuario,
        status: 'processing',
        api_key_usado: 'openai'
      })
      .select()
      .single();

    console.log(`📝 [Agentes API] Log criado: ${logData?.id}`);

    // Buscar OpenAI API Key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Chamar OpenAI
    console.log(`🤖 [Agentes API] Chamando OpenAI...`);

    const openaiPayload = {
      model: agente.modelo_ia || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: agente.prompt_sistema || 'Você é um assistente jurídico.' },
        { role: 'user', content: input_usuario }
      ],
      temperature: agente.temperatura || 0.7,
      max_tokens: 500
    };

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

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI Error: ${responseData.error?.message || 'Erro desconhecido'}`);
    }

    const aiResponse = responseData.choices[0]?.message?.content || 'Resposta não disponível';

    // Atualizar log
    if (logData?.id) {
      await supabaseClient
        .from('logs_execucao_agentes')
        .update({
          resposta_ia: aiResponse,
          status: 'success',
          tempo_execucao: executionTime,
          api_key_usado: 'openai'
        })
        .eq('id', logData.id);
    }

    console.log(`✅ [Agentes API] Processamento concluído em ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      source: 'openai',
      response: aiResponse,
      agente_nome: agente.nome,
      execution_time: executionTime,
      tokens: responseData.usage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Agentes API] Erro:', error);

    return new Response(
      JSON.stringify({
        error: 'Erro ao processar requisição',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
