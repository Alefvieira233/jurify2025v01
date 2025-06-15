
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8NPayload {
  agente_id: string;
  nome_agente: string;
  input_usuario: string;
  prompt_base: string;
  parametros_avancados?: any;
  area_juridica?: string;
  tipo_agente?: string;
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

    console.log('🔗 N8N Webhook Forwarder - Iniciado');

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: N8NPayload = await req.json();
    console.log('📦 Payload recebido:', payload);

    // Validar payload obrigatório
    if (!payload.agente_id || !payload.input_usuario) {
      return new Response(JSON.stringify({ 
        error: 'agente_id e input_usuario são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar workflow ativo do N8N
    const { data: workflows, error: workflowError } = await supabaseClient
      .from('n8n_workflows')
      .select('*')
      .eq('ativo', true)
      .eq('tipo_workflow', 'agente_ia')
      .limit(1);

    if (workflowError || !workflows || workflows.length === 0) {
      console.error('❌ Nenhum workflow N8N ativo encontrado:', workflowError);
      return new Response(JSON.stringify({ 
        error: 'Nenhum workflow N8N configurado' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const workflow = workflows[0];
    console.log('🔧 Workflow encontrado:', workflow.nome);

    // Criar log de execução
    const { data: logData, error: logError } = await supabaseClient
      .from('logs_execucao_agentes')
      .insert([{
        agente_id: payload.agente_id,
        input_recebido: payload.input_usuario,
        status: 'processing',
        n8n_webhook_url: workflow.webhook_url,
        n8n_status: 'sending'
      }])
      .select()
      .single();

    if (logError) {
      console.error('❌ Erro ao criar log:', logError);
    }

    const logId = logData?.id;

    // Preparar payload para N8N
    const n8nPayload = {
      timestamp: new Date().toISOString(),
      source: 'jurify_saas',
      agente: {
        id: payload.agente_id,
        nome: payload.nome_agente,
        area_juridica: payload.area_juridica,
        tipo: payload.tipo_agente
      },
      input: payload.input_usuario,
      prompt_base: payload.prompt_base,
      parametros: payload.parametros_avancados || {},
      metadata: {
        log_id: logId,
        workflow_id: workflow.id
      }
    };

    console.log('🚀 Enviando para N8N:', workflow.webhook_url);

    // Enviar para N8N
    const n8nHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Adicionar API Key se configurada
    if (workflow.api_key) {
      n8nHeaders['Authorization'] = `Bearer ${workflow.api_key}`;
    }

    let n8nResponse;
    let n8nError = null;

    try {
      const response = await fetch(workflow.webhook_url, {
        method: 'POST',
        headers: n8nHeaders,
        body: JSON.stringify(n8nPayload),
      });

      const responseText = await response.text();
      
      if (response.ok) {
        console.log('✅ N8N Response OK:', response.status);
        try {
          n8nResponse = JSON.parse(responseText);
        } catch {
          n8nResponse = { message: responseText };
        }
      } else {
        console.error('❌ N8N Response Error:', response.status, responseText);
        n8nError = `HTTP ${response.status}: ${responseText}`;
      }

    } catch (error) {
      console.error('❌ Erro ao enviar para N8N:', error);
      n8nError = error.message;
    }

    // Atualizar log com resultado
    if (logId) {
      const updateData: any = {
        n8n_response: n8nResponse,
        n8n_status: n8nError ? 'error' : 'sent',
        status: n8nError ? 'error' : 'success'
      };

      if (n8nError) {
        updateData.n8n_error = n8nError;
        updateData.erro_detalhes = n8nError;
      }

      await supabaseClient
        .from('logs_execucao_agentes')
        .update(updateData)
        .eq('id', logId);
    }

    // Retornar resposta
    if (n8nError) {
      return new Response(JSON.stringify({ 
        success: false,
        error: n8nError,
        log_id: logId,
        fallback_message: 'Erro na comunicação com N8N. Processamento local seria executado aqui.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      n8n_response: n8nResponse,
      log_id: logId,
      workflow_used: workflow.nome
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
