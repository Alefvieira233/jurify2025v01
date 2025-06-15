
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8NPayload {
  agentId: string;
  prompt: string;
  parameters: {
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
}

serve(async (req) => {
  console.log('🔗 N8N Webhook Forwarder - Iniciado');
  console.log('📥 Método:', req.method);
  console.log('📥 Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2));

    // Validar payload obrigatório
    if (!payload.agentId || !payload.prompt) {
      console.log('❌ Payload inválido - agentId ou prompt faltando');
      return new Response(JSON.stringify({ 
        error: 'agentId e prompt são obrigatórios',
        received: payload
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // URL fixa de produção N8N
    const PRODUCTION_N8N_URL = 'https://primary-production-adcb.up.railway.app/webhook/Agente%20Jurify';
    console.log('🎯 URL N8N de produção:', PRODUCTION_N8N_URL);

    // Criar log de execução
    const { data: logData, error: logError } = await supabaseClient
      .from('logs_execucao_agentes')
      .insert([{
        agente_id: payload.agentId,
        input_recebido: payload.prompt,
        status: 'processing',
        n8n_webhook_url: PRODUCTION_N8N_URL,
        n8n_status: 'sending'
      }])
      .select()
      .single();

    if (logError) {
      console.error('❌ Erro ao criar log:', logError);
    } else {
      console.log('✅ Log criado com ID:', logData?.id);
    }

    const logId = logData?.id;

    // Preparar payload para N8N no formato correto
    const n8nPayload: N8NPayload = {
      agentId: payload.agentId,
      prompt: payload.prompt,
      parameters: {
        temperature: payload.parameters?.temperature || 0.7,
        top_p: payload.parameters?.top_p || 1,
        frequency_penalty: payload.parameters?.frequency_penalty || 0,
        presence_penalty: payload.parameters?.presence_penalty || 0
      }
    };

    console.log('📤 Enviando para N8N:', JSON.stringify(n8nPayload, null, 2));

    // Headers para N8N
    const n8nHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Jurify-N8N-Integration/1.0',
      'Accept': 'application/json',
    };

    let n8nResponse;
    let n8nError = null;
    let responseStatus = 0;

    try {
      console.log('🚀 Fazendo requisição para N8N...');
      const response = await fetch(PRODUCTION_N8N_URL, {
        method: 'POST',
        headers: n8nHeaders,
        body: JSON.stringify(n8nPayload),
      });

      responseStatus = response.status;
      const responseText = await response.text();
      
      console.log('📥 N8N Response Status:', response.status);
      console.log('📥 N8N Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('📥 N8N Response Body:', responseText);
      
      if (response.ok) {
        console.log('✅ N8N Response OK');
        try {
          n8nResponse = JSON.parse(responseText);
        } catch (parseError) {
          console.log('⚠️ Resposta não é JSON válido, tratando como texto');
          n8nResponse = { 
            message: responseText, 
            raw_response: responseText,
            response_type: 'text'
          };
        }
      } else {
        console.error('❌ N8N Response Error:', response.status, responseText);
        n8nError = `HTTP ${response.status}: ${responseText}`;
        n8nResponse = {
          error: true,
          status: response.status,
          message: responseText,
          raw_response: responseText
        };
      }

    } catch (error) {
      console.error('❌ Erro na requisição N8N:', error);
      n8nError = `Network Error: ${error.message}`;
      n8nResponse = {
        error: true,
        message: error.message,
        type: 'network_error'
      };
    }

    // Atualizar log com resultado
    if (logId) {
      const updateData: any = {
        n8n_response: n8nResponse,
        n8n_status: n8nError ? 'error' : 'success',
        status: n8nError ? 'error' : 'success',
        response_status: responseStatus
      };

      if (n8nError) {
        updateData.n8n_error = n8nError;
        updateData.erro_detalhes = n8nError;
      }

      const { error: updateError } = await supabaseClient
        .from('logs_execucao_agentes')
        .update(updateData)
        .eq('id', logId);

      if (updateError) {
        console.error('❌ Erro ao atualizar log:', updateError);
      } else {
        console.log('✅ Log atualizado com sucesso');
      }
    }

    // Retornar resposta para o frontend
    const responseData = {
      success: !n8nError,
      response: n8nResponse,
      log_id: logId,
      webhook_url: PRODUCTION_N8N_URL,
      status: responseStatus,
      timestamp: new Date().toISOString()
    };

    if (n8nError) {
      responseData.error = n8nError;
    }

    console.log('📤 Retornando para frontend:', JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      status: n8nError ? 500 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral na edge function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
