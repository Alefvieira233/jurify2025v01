/**
 * 🚀 JURIFY AI AGENT PROCESSOR - EDGE FUNCTION
 *
 * Edge Function segura para processar requisições de IA dos agentes.
 * Todas as chamadas para OpenAI são feitas aqui no servidor, protegendo a API key.
 *
 * @version 2.0.0
 * @security Enterprise Grade
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";
import { applyRateLimit } from "../_shared/rate-limiter.ts";

// 🔒 CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🎯 TIPOS DE REQUISIÇÃO
interface AgentAIRequest {
  agentName: string;
  agentSpecialization: string;
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  leadId?: string;
  tenantId?: string;
  userId?: string;
}

interface AgentAIResponse {
  result: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  agentName: string;
  timestamp: string;
}

// 🛡️ Validação de Input
function validateRequest(data: unknown): data is AgentAIRequest {
  const req = data as Partial<AgentAIRequest>;

  if (!req.agentName || typeof req.agentName !== "string") {
    throw new Error("agentName is required and must be a string");
  }

  if (!req.agentSpecialization || typeof req.agentSpecialization !== "string") {
    throw new Error("agentSpecialization is required and must be a string");
  }

  if (!req.systemPrompt || typeof req.systemPrompt !== "string") {
    throw new Error("systemPrompt is required and must be a string");
  }

  if (!req.userPrompt || typeof req.userPrompt !== "string") {
    throw new Error("userPrompt is required and must be a string");
  }

  return true;
}

// 🧠 Processa requisição de IA
async function processAIRequest(
  openai: OpenAI,
  request: AgentAIRequest
): Promise<AgentAIResponse> {
  const {
    agentName,
    agentSpecialization,
    systemPrompt,
    userPrompt,
    context,
    model = "gpt-4-turbo-preview",
    temperature = 0.7,
    maxTokens = 1500,
  } = request;

  console.log(`🤖 Processing AI request for agent: ${agentName}`);

  // Monta mensagens para a OpenAI
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "system",
      content: `Você é ${agentName}, especialista em ${agentSpecialization}. ${systemPrompt}`,
    },
  ];

  // Adiciona contexto se fornecido
  if (context && Object.keys(context).length > 0) {
    messages.push({
      role: "user",
      content: `Contexto: ${JSON.stringify(context, null, 2)}`,
    });
  }

  messages.push({
    role: "user",
    content: userPrompt,
  });

  // Chama OpenAI
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const result = completion.choices[0]?.message?.content || "Erro ao processar requisição";

  return {
    result,
    usage: completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined,
    model: completion.model,
    agentName,
    timestamp: new Date().toISOString(),
  };
}

// 🆔 Gera execution_id único
function generateExecutionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `exec_${timestamp}_${random}`;
}

// 📝 Cria registro de execução no banco
async function createExecution(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  request: AgentAIRequest,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase.from("agent_executions").insert({
      execution_id: executionId,
      lead_id: request.leadId || null,
      tenant_id: request.tenantId || null,
      user_id: userId,
      status: "processing",
      current_agent: request.agentName,
      agents_involved: [request.agentName],
      started_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Error creating execution:", error);
    } else {
      console.log(`✅ Execution created: ${executionId}`);
    }
  } catch (error) {
    console.error("❌ Error creating execution:", error);
  }
}

// ✅ Atualiza execução com sucesso
async function completeExecution(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  startTime: number,
  tokensUsed: number
): Promise<void> {
  try {
    const duration = Date.now() - startTime;

    await supabase
      .from("agent_executions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_duration_ms: duration,
        total_tokens_used: tokensUsed,
      })
      .eq("execution_id", executionId);

    console.log(`✅ Execution completed: ${executionId} (${duration}ms)`);
  } catch (error) {
    console.error("❌ Error completing execution:", error);
  }
}

// ❌ Atualiza execução com erro
async function failExecution(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  errorMessage: string
): Promise<void> {
  try {
    await supabase
      .from("agent_executions")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("execution_id", executionId);

    console.log(`❌ Execution failed: ${executionId}`);
  } catch (error) {
    console.error("❌ Error failing execution:", error);
  }
}

// 📊 Salva log de processamento no banco
async function logAIProcessing(
  supabase: ReturnType<typeof createClient>,
  executionId: string,
  request: AgentAIRequest,
  response: AgentAIResponse,
  userId?: string
): Promise<void> {
  try {
    await supabase.from("agent_ai_logs").insert({
      execution_id: executionId,
      agent_name: request.agentName,
      lead_id: request.leadId || null,
      tenant_id: request.tenantId || null,
      user_id: userId || null,
      model: response.model,
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
      result_preview: response.result.substring(0, 200),
      created_at: new Date().toISOString(),
    });

    console.log(`✅ AI processing logged for execution: ${executionId}`);
  } catch (error) {
    console.error("❌ Error logging AI processing:", error);
    // Não interrompe o fluxo se falhar o log
  }
}

// 🚀 HANDLER PRINCIPAL
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔐 Verificação de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Inicializa Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica usuário autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      throw new Error("Unauthorized: Invalid token");
    }

    console.log(`✅ Authenticated user: ${user.id}`);

    // 🛡️ Rate Limiting - Protege custos da OpenAI
    // Limite: 20 requisições de IA por minuto por usuário
    const rateLimitCheck = await applyRateLimit(
      req,
      {
        maxRequests: 20,
        windowSeconds: 60,
        namespace: "ai-agent",
      },
      {
        supabase,
        user,
        corsHeaders,
      }
    );

    if (!rateLimitCheck.allowed) {
      console.warn(
        `⚠️ Rate limit exceeded for user ${user.id}:`,
        rateLimitCheck.result
      );
      return rateLimitCheck.response;
    }

    console.log(
      `✅ Rate limit OK: ${rateLimitCheck.result.remaining}/${rateLimitCheck.result.limit} remaining`
    );

    // 🔑 Verifica API Key da OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // 📥 Parse e valida request
    const requestData = await req.json();
    validateRequest(requestData);

    const aiRequest = requestData as AgentAIRequest;

    // 🆔 Gera execution_id único
    const executionId = generateExecutionId();
    const startTime = Date.now();

    // 📝 Cria registro de execução
    await createExecution(supabase, executionId, aiRequest, user.id);

    try {
      // 🤖 Inicializa OpenAI
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      // 🧠 Processa requisição de IA
      const aiResponse = await processAIRequest(openai, aiRequest);

      // ✅ Atualiza execução com sucesso
      const tokensUsed = aiResponse.usage?.total_tokens || 0;
      await completeExecution(supabase, executionId, startTime, tokensUsed);

      // 📊 Salva log (não-bloqueante)
      logAIProcessing(supabase, executionId, aiRequest, aiResponse, user.id).catch(
        console.error
      );

      // ✅ Retorna resposta com execution_id
      return new Response(
        JSON.stringify({
          ...aiResponse,
          executionId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (processingError) {
      // ❌ Marca execução como falha
      const errorMsg =
        processingError instanceof Error
          ? processingError.message
          : "Unknown processing error";
      await failExecution(supabase, executionId, errorMsg);

      throw processingError;
    }
  } catch (error) {
    console.error("❌ Error in ai-agent-processor:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const statusCode = errorMessage.includes("Unauthorized") ? 401 : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: statusCode,
      }
    );
  }
});
