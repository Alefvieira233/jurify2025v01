import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 🚀 PADRÃO ELON MUSK: Rate limiting distribuído Tesla/SpaceX grade
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// 🚀 RATE LIMITING DISTRIBUÍDO COM DENO KV
class EdgeRateLimit {
  private kv: Deno.Kv | null = null;

  async init() {
    try {
      this.kv = await Deno.openKv();
      console.log('🚀 [EdgeRateLimit] Deno KV inicializado');
    } catch (error) {
      console.error('❌ [EdgeRateLimit] Erro ao inicializar Deno KV:', error);
    }
  }

  async checkRateLimit(
    identifier: string,
    windowMs: number = 60000, // 1 minuto
    maxRequests: number = 100
  ): Promise<RateLimitResult> {
    if (!this.kv) {
      await this.init();
    }

    const key = [`rate_limit`, identifier];
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Buscar dados atuais
      const result = await this.kv!.get(key);
      let requests: number[] = result.value as number[] || [];

      // Filtrar requests dentro da janela
      requests = requests.filter(time => time > windowStart);

      const allowed = requests.length < maxRequests;
      
      if (allowed) {
        requests.push(now);
        // Armazenar com TTL
        await this.kv!.set(key, requests, { expireIn: windowMs });
      }

      return {
        allowed,
        remaining: Math.max(0, maxRequests - requests.length),
        resetTime: windowStart + windowMs,
        totalHits: requests.length
      };

    } catch (error) {
      console.error(`❌ [EdgeRateLimit] Erro ao verificar ${identifier}:`, error);
      // Fail-open em caso de erro
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs,
        totalHits: 0
      };
    }
  }
}

const rateLimit = new EdgeRateLimit();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgenteRequest {
  agente_id: string;
  input_usuario: string;
  use_n8n?: boolean;
}

// ✅ CACHE SEGURO: Usando Deno KV para persistência
const kv = await Deno.openKv();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const RATE_LIMIT = 100; // 100 requests por minuto
const RATE_WINDOW = 60 * 1000; // 1 minuto

// Cache helper functions
const getCachedAgent = async (agentId: string) => {
  const result = await kv.get(["agent_cache", agentId]);
  if (!result.value) return null;
  
  const cached = result.value as any;
  if (Date.now() - cached.cached_at > CACHE_TTL) {
    await kv.delete(["agent_cache", agentId]);
    return null;
  }
  
  return cached;
};

const setCachedAgent = async (agentId: string, data: any) => {
  await kv.set(["agent_cache", agentId], {
    ...data,
    cached_at: Date.now()
  }, { expireIn: CACHE_TTL });
};

// Rate limiting with KV store
const checkRateLimit = async (clientIP: string): Promise<boolean> => {
  const key = ["rate_limit", clientIP];
  const result = await kv.get(key);
  const now = Date.now();
  
  if (!result.value) {
    await kv.set(key, { count: 1, resetTime: now + RATE_WINDOW }, { expireIn: RATE_WINDOW });
    return true;
  }
  
  const clientData = result.value as { count: number; resetTime: number };
  
  if (now > clientData.resetTime) {
    await kv.set(key, { count: 1, resetTime: now + RATE_WINDOW }, { expireIn: RATE_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  await kv.set(key, { count: clientData.count + 1, resetTime: clientData.resetTime }, { expireIn: RATE_WINDOW });
  return true;
};

// Rate limiting function moved above

serve(async (req) => {
  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  console.log(`🤖 [Agentes API] Request iniciado - IP: ${clientIP}`);

  // 🚀 VERIFICAÇÃO DE RATE LIMIT - TESLA/SPACEX GRADE
  const rateLimitResult = await rateLimit.checkRateLimit(`ip:${clientIP}`, 60000, 100);
  
  if (!rateLimitResult.allowed) {
    console.warn(`🚨 [RateLimit] IP bloqueado: ${clientIP} - ${rateLimitResult.totalHits}/100 requests`);
    return new Response(
      JSON.stringify({
        error: 'Rate limit excedido',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        resetTime: rateLimitResult.resetTime
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      }
    );
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Buscar agente (com cache seguro)
    let agente = await getCachedAgent(agente_id);
    if (!agente) {
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

      agente = agenteData;
      await setCachedAgent(agente_id, agente);
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
