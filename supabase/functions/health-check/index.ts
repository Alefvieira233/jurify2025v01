
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🏥 [Health Check] Iniciando verificação do sistema...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 0,
    services: {
      supabase: 'unknown',
      openai: 'unknown',
      n8n: 'unknown',
      database: 'unknown'
    },
    performance: {
      responseTime: 0,
      memoryUsage: 0
    }
  };

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Teste de conexão com Supabase Database
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      healthStatus.services.supabase = 'connected';
      healthStatus.services.database = 'connected';
      console.log('✅ [Health Check] Supabase conectado');
    } catch (error) {
      console.error('❌ [Health Check] Erro Supabase:', error);
      healthStatus.services.supabase = 'error';
      healthStatus.services.database = 'error';
      healthStatus.status = 'degraded';
    }

    // Teste de conexão com OpenAI
    try {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
          },
        });
        
        if (response.ok) {
          healthStatus.services.openai = 'connected';
          console.log('✅ [Health Check] OpenAI conectado');
        } else {
          healthStatus.services.openai = 'error';
          healthStatus.status = 'degraded';
        }
      } else {
        healthStatus.services.openai = 'not_configured';
      }
    } catch (error) {
      console.error('❌ [Health Check] Erro OpenAI:', error);
      healthStatus.services.openai = 'error';
      healthStatus.status = 'degraded';
    }

    // Teste de conexão com N8N (URL de produção)
    try {
      const n8nUrl = 'https://primary-production-adcb.up.railway.app/webhook/health';
      const response = await fetch(n8nUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Jurify-Health-Check/1.0',
        },
      });
      
      if (response.ok || response.status === 404) { // 404 é aceitável para webhook
        healthStatus.services.n8n = 'connected';
        console.log('✅ [Health Check] N8N conectado');
      } else {
        healthStatus.services.n8n = 'error';
        healthStatus.status = 'degraded';
      }
    } catch (error) {
      console.error('❌ [Health Check] Erro N8N:', error);
      healthStatus.services.n8n = 'error';
      healthStatus.status = 'degraded';
    }

    // Calcular métricas de performance
    const endTime = Date.now();
    healthStatus.uptime = endTime;
    healthStatus.performance.responseTime = endTime - startTime;
    
    // Tentar obter uso de memória (se disponível)
    try {
      healthStatus.performance.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    } catch {
      healthStatus.performance.memoryUsage = 0;
    }

    console.log(`🏥 [Health Check] Verificação concluída em ${healthStatus.performance.responseTime}ms`);
    console.log(`📊 [Health Check] Status geral: ${healthStatus.status}`);

    return new Response(JSON.stringify(healthStatus), {
      status: healthStatus.status === 'ok' ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [Health Check] Erro crítico:', error);
    
    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: Date.now() - startTime,
      services: healthStatus.services
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
