
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validarApiKey(apiKey: string): Promise<boolean> {
  const { data } = await supabase.rpc('validar_api_key', { _key_value: apiKey });
  return data || false;
}

async function buscarAgente(agenteId: string) {
  const { data, error } = await supabase.rpc('buscar_agente_para_execucao', { _agente_id: agenteId });
  if (error || !data || data.length === 0) {
    throw new Error('Agente não encontrado ou inativo');
  }
  return data[0];
}

async function executarIA(agente: any, input: string): Promise<string> {
  const promptCompleto = `${agente.prompt_base}\n\nInput do usuário: ${input}`;
  
  const parametros = agente.parametros_avancados || {
    temperatura: 0.7,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `Você é um assistente jurídico especializado em ${agente.descricao_funcao}. ${agente.prompt_base}`
        },
        { role: 'user', content: input }
      ],
      temperature: parametros.temperatura || 0.7,
      top_p: parametros.top_p || 0.9,
      frequency_penalty: parametros.frequency_penalty || 0,
      presence_penalty: parametros.presence_penalty || 0,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API OpenAI: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function registrarLog(agenteId: string, input: string, resposta: string | null, status: string, tempoExecucao: number, erro?: string, apiKey?: string) {
  await supabase.from('logs_execucao_agentes').insert({
    agente_id: agenteId,
    input_recebido: input,
    resposta_ia: resposta,
    status,
    tempo_execucao: tempoExecucao,
    erro_detalhes: erro,
    api_key_usado: apiKey?.substring(0, 8) + '...'
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // Verificar autenticação por API Key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey || !(await validarApiKey(apiKey))) {
      return new Response(JSON.stringify({ error: 'API Key inválida ou ausente' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /agentes/executar - Executar agente IA
    if (path === '/agentes/executar' && req.method === 'POST') {
      const { agente_id, input } = await req.json();
      
      if (!agente_id || !input) {
        return new Response(JSON.stringify({ error: 'agente_id e input são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const inicioTempo = Date.now();
      
      try {
        const agente = await buscarAgente(agente_id);
        const resposta = await executarIA(agente, input);
        const tempoExecucao = Date.now() - inicioTempo;
        
        await registrarLog(agente_id, input, resposta, 'success', tempoExecucao, undefined, apiKey);
        
        return new Response(JSON.stringify({ 
          resposta,
          agente_nome: agente.nome,
          tempo_execucao: tempoExecucao
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        const tempoExecucao = Date.now() - inicioTempo;
        await registrarLog(agente_id, input, null, 'error', tempoExecucao, error.message, apiKey);
        
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /agentes/listar - Listar agentes
    if (path === '/agentes/listar' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('id, nome, tipo_agente, status')
        .eq('status', 'ativo')
        .order('nome');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ agentes: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /webhook/n8n - Webhook para N8N
    if (path === '/webhook/n8n' && req.method === 'POST') {
      const { agente_id, input, workflow_id } = await req.json();
      
      if (!agente_id || !input) {
        return new Response(JSON.stringify({ error: 'agente_id e input são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const inicioTempo = Date.now();
      
      try {
        const agente = await buscarAgente(agente_id);
        const resposta = await executarIA(agente, input);
        const tempoExecucao = Date.now() - inicioTempo;
        
        await registrarLog(agente_id, input, resposta, 'success', tempoExecucao, undefined, `n8n-${workflow_id || 'unknown'}`);
        
        return new Response(JSON.stringify({ 
          resposta,
          success: true,
          agente_nome: agente.nome,
          tempo_execucao_ms: tempoExecucao
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        const tempoExecucao = Date.now() - inicioTempo;
        await registrarLog(agente_id, input, null, 'error', tempoExecucao, error.message, `n8n-${workflow_id || 'unknown'}`);
        
        return new Response(JSON.stringify({ 
          error: error.message,
          success: false
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral na API:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
