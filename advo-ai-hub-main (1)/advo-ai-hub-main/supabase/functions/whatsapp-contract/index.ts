
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const zapiToken = Deno.env.get('ZAPI_TOKEN');
const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { contratoId, telefone, nomeCliente, linkAssinatura } = await req.json();

    if (!zapiToken || !zapiInstanceId) {
      throw new Error('Credenciais do Z-API não configuradas');
    }

    if (!telefone || !linkAssinatura) {
      throw new Error('Telefone e link de assinatura são obrigatórios');
    }

    // Formatar telefone (remover caracteres especiais)
    const phoneNumber = telefone.replace(/\D/g, '');
    
    const message = `Olá ${nomeCliente}! 

Seu contrato está pronto para assinatura digital. 

🔗 Clique no link abaixo para assinar:
${linkAssinatura}

⚖️ Jurify - Gestão Jurídica
Atendimento profissional e seguro.`;

    // Enviar mensagem via Z-API
    const response = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro do Z-API: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    // Atualizar contrato no Supabase
    await supabase
      .from('contratos')
      .update({
        data_envio_whatsapp: new Date().toISOString()
      })
      .eq('id', contratoId);

    // Log do evento
    await supabase
      .from('zapsign_logs')
      .insert({
        contrato_id: contratoId,
        evento: 'enviado_whatsapp',
        dados_evento: { telefone: phoneNumber, message_id: result.messageId }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mensagem enviada com sucesso',
      data: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no envio WhatsApp:', error);
    
    // Log do erro
    await supabase
      .from('zapsign_logs')
      .insert({
        contrato_id: req.body?.contratoId || null,
        evento: 'erro',
        dados_evento: { erro: error.message, tipo: 'envio_whatsapp' }
      });

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
