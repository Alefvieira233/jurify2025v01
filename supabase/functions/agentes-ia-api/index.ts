
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

// Cache para agentes (evitar consultas repetidas)
const agentCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Rate limiting por IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // 100 requests por minuto
const RATE_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

serve(async (req) => {
  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  console.log(`🤖 [Agentes API] Request iniciado - IP: ${clientIP}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    console.log(`⚠️ [Agentes API] Rate limit excedido para IP: ${clientIP}`);
    return new Response(JSON.stringify({ 
      error: 'Rate limit exceeded',
      message: 'Muitas requisições. Tente novamente em 1 minuto.'
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { agente_id, input_usuario, use_n8n = true }: AgenteRequest = await req.json();
    
    if (!agente_id || !input_usuario) {
      return new Response(JSON.stringify({ 
        error: 'agente_id e input_usuario são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar agente (com cache)
    let agente = agentCache.get(agente_id);
    if (!agente || (Date.now() - agente.cached_at) > CACHE_TTL) {
      console.log(`🔍 [Agentes API] Buscando agente ${agente_id} no database...`);
      const { data: agenteData, error: agenteError } = await supabaseClient
        .from('agentes_ia')
        .select('*')
        .eq('id', agente_id)
        .eq('status', 'ativo')
        .single();

      if (agenteError || !agenteData) {
        console.error('❌ [Agentes API] Agente não encontrado:', agenteError);
        return new Response(JSON.stringify({ 
          error: 'Agente não encontrado ou inativo' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      agente = { ...agenteData, cached_at: Date.now() };
      agentCache.set(agente_id, agente);
    }

    console.log(`✅ [Agentes API] Agente encontrado: ${agente.nome}`);

    // Preparar prompt completo
    const promptCompleto = `${agente.prompt_base}\n\nInput do usuário: ${input_usuario}`;

    // Tentar N8N primeiro (se habilitado)
    if (use_n8n) {
      console.log('🔗 [Agentes API] Tentando execução via N8N...');
      
      try {
        const n8nPayload = {
          agentId: agente.id,
          prompt: promptCompleto,
          parameters: {
            temperature: agente.parametros_avancados?.temperatura || 0.7,
            top_p: agente.parametros_avancados?.top_p || 1,
            frequency_penalty: agente.parametros_avancados?.frequency_penalty || 0,
            presence_penalty: agente.parametros_avancados?.presence_penalty || 0
          }
        };

        // Usar timeout para N8N (3 segundos max)
        const n8nTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('N8N timeout')), 3000)
        );
        
        const n8nPromise = supabaseClient.functions.invoke('n8n-webhook-forwarder', {
          body: n8nPayload
        });

        const n8nResponse = await Promise.race([n8nPromise, n8nTimeout]);

        if (n8nResponse.data?.success) {
          const executionTime = Date.now() - startTime;
          console.log(`✅ [Agentes API] N8N processou com sucesso em ${executionTime}ms`);
          
          return new Response(JSON.stringify({
            success: true,
            source: 'n8n',
            response: n8nResponse.data.response,
            agente_nome: agente.nome,
            log_id: n8nResponse.data.log_id,
            execution_time: executionTime
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (n8nError) {
        console.log(`⚠️ [Agentes API] N8N falhou, usando fallback local: ${n8nError.message}`);
      }
    }

    // Fallback: Processamento local com OpenAI
    console.log('🔄 [Agentes API] Executando localmente com OpenAI...');

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API Key não configurada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar log de execução (async - não bloquear resposta)
    const logPromise = supabaseClient
      .from('logs_execucao_agentes')
      .insert([{
        agente_id: agente.id,
        input_recebido: input_usuario,
        status: 'processing',
        n8n_status: use_n8n ? 'fallback' : 'disabled'
      }])
      .select()
      .single();

    // Preparar payload OpenAI
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
      model: agente.parametros_avancados?.modelo || 'gpt-4o-mini',
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

    // Executar OpenAI com timeout
    const openaiTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI timeout')), 10000)
    );
    
    const openaiPromise = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiPayload),
    });

    const openaiResponse = await Promise.race([openaiPromise, openaiTimeout]);
    const responseData = await openaiResponse.json();
    const executionTime = Date.now() - startTime;

    if (openaiResponse.ok) {
      const aiResponse = responseData.choices[0]?.message?.content || 'Resposta não disponível';
      
      // Atualizar log (async)
      try {
        const { data: logData } = await logPromise;
        if (logData?.id) {
          supabaseClient
            .from('logs_execucao_agentes')
            .update({
              resposta_ia: aiResponse,
              status: 'success',
              tempo_execucao: executionTime,
              api_key_usado: 'openai'
            })
            .eq('id', logData.id)
            .then(() => console.log(`📝 [Agentes API] Log atualizado: ${logData.id}`));
        }
      } catch (logError) {
        console.error('⚠️ [Agentes API] Erro ao salvar log:', logError);
      }

      console.log(`✅ [Agentes API] Processamento local concluído em ${executionTime}ms`);

      return new Response(JSON.stringify({
        success: true,
        source: 'local_openai',
        response: aiResponse,
        agente_nome: agente.nome,
        execution_time: executionTime
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`OpenAI Error: ${responseData.error?.message || 'Erro desconhecido'}`);
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ [Agentes API] Erro geral em ${executionTime}ms:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro no processamento do agente IA',
      details: error.message,
      execution_time: executionTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
