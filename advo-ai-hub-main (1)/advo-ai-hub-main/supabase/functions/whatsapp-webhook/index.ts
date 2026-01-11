import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { applyRateLimit, getRequestIdentifier } from "../_shared/rate-limiter.ts";

console.log("🚀 WhatsApp Webhook Function Started");

const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);

        // 2. Handle Webhook Verification (GET)
        if (req.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");

            if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
                console.log("✅ Webhook verified successfully");
                return new Response(challenge, {
                    headers: { "Content-Type": "text/plain" },
                    status: 200,
                });
            } else {
                console.error("❌ Webhook verification failed");
                return new Response("Forbidden", { status: 403 });
            }
        }

        // 3. Handle Incoming Messages (POST)
        if (req.method === "POST") {
            // 3.1. Inicializa Supabase Client primeiro
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            // 3.2. Rate Limiting - Protege contra abuso/DoS
            // Limite: 60 mensagens por minuto por origem
            const rateLimitCheck = await applyRateLimit(
                req,
                {
                    maxRequests: 60,
                    windowSeconds: 60,
                    namespace: "whatsapp-webhook",
                },
                {
                    supabase,
                    corsHeaders,
                }
            );

            if (!rateLimitCheck.allowed) {
                console.warn(
                    "⚠️ Rate limit exceeded:",
                    getRequestIdentifier(req),
                    rateLimitCheck.result
                );
                return rateLimitCheck.response;
            }

            console.log(
                "✅ Rate limit OK:",
                `${rateLimitCheck.result.remaining}/${rateLimitCheck.result.limit} remaining`
            );

            // 3.3. Parse payload
            const payload = await req.json();
            console.log("📨 Received webhook payload:", JSON.stringify(payload, null, 2));

            // Process each entry
            for (const entry of payload.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value;

                    if (value && value.messages) {
                        const phoneNumberId = value.metadata.phone_number_id;

                        // Process each message
                        for (const message of value.messages) {
                            await processMessage(supabase, message, phoneNumberId);
                        }
                    }
                }
            }

            return new Response("OK", {
                headers: { ...corsHeaders, "Content-Type": "text/plain" },
                status: 200,
            });
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

async function processMessage(supabase: any, message: any, phoneNumberId: string) {
    try {
        // Only process text messages for now
        if (message.type !== "text") {
            console.log("⚠️ Skipping non-text message type:", message.type);
            return;
        }

        const from = message.from; // User's phone number
        const text = message.text.body;
        const name = message._vendor?.name || "Unknown"; // Meta sometimes sends name

        console.log(`📥 Processing message from ${from}: ${text}`);

        // 1. Find or Create Tenant & Lead
        // For MVP/SaaS, we need to map phoneNumberId to a Tenant.
        // Fallback: Use the first tenant found or a default one if not mapped.
        // Ideally, we would have a table `whatsapp_configs` mapping phone_number_id -> tenant_id.

        // Attempt to find tenant from an existing conversation or default
        let tenantId = null;

        // Try to find existing conversation for this number to get tenant_id
        const { data: existingConv } = await supabase
            .from("whatsapp_conversations")
            .select("tenant_id")
            .eq("phone_number", from)
            .limit(1)
            .single();

        if (existingConv) {
            tenantId = existingConv.tenant_id;
        } else {
            // Fallback: Get the first tenant (System/Admin) - CRITICAL for first contact
            // In a real multi-tenant app, you MUST map phone_number_id to tenant_id.
            const { data: tenant } = await supabase
                .from("profiles") // Assuming profiles has tenant_id
                .select("tenant_id")
                .limit(1)
                .single();

            tenantId = tenant?.tenant_id;
        }

        if (!tenantId) {
            console.error("❌ No tenant found for message processing");
            return;
        }

        // 2. Find or Create Lead
        let leadId = null;
        const { data: lead } = await supabase
            .from("leads")
            .select("id")
            .eq("phone", from)
            .eq("tenant_id", tenantId)
            .single();

        if (lead) {
            leadId = lead.id;
        } else {
            const { data: newLead, error: leadError } = await supabase
                .from("leads")
                .insert({
                    tenant_id: tenantId,
                    name: name,
                    phone: from,
                    source: "whatsapp",
                    status: "new",
                    message: text // Initial message
                })
                .select("id")
                .single();

            if (leadError) {
                console.error("❌ Error creating lead:", leadError);
                return;
            }
            leadId = newLead.id;
        }

        // 3. Find or Create Conversation
        let conversationId = null;
        const { data: conversation } = await supabase
            .from("whatsapp_conversations")
            .select("id")
            .eq("lead_id", leadId)
            .eq("tenant_id", tenantId)
            .single();

        if (conversation) {
            conversationId = conversation.id;
            // Update last message
            await supabase
                .from("whatsapp_conversations")
                .update({
                    last_message: text,
                    last_message_at: new Date().toISOString(),
                    unread_count: 1 // Increment logic could be better
                })
                .eq("id", conversationId);
        } else {
            const { data: newConv, error: convError } = await supabase
                .from("whatsapp_conversations")
                .insert({
                    tenant_id: tenantId,
                    lead_id: leadId,
                    phone_number: from,
                    contact_name: name,
                    last_message: text,
                    status: "ativo"
                })
                .select("id")
                .single();

            if (convError) {
                console.error("❌ Error creating conversation:", convError);
                return;
            }
            conversationId = newConv.id;
        }

        // 4. Save Incoming Message
        await supabase.from("whatsapp_messages").insert({
            conversation_id: conversationId,
            sender: "lead",
            content: text,
            message_type: "text",
            timestamp: new Date().toISOString()
        });

        // 5. Trigger AI Agent
        // We invoke the ai-agent-processor function
        console.log("🤖 Invoking AI Agent...");

        const { data: aiResponse, error: aiError } = await supabase.functions.invoke("ai-agent-processor", {
            body: {
                agentName: "Coordenador", // Entry point agent
                agentSpecialization: "Triagem e Atendimento Inicial",
                systemPrompt: "Você é um assistente jurídico virtual. Seu objetivo é qualificar o lead e entender o problema jurídico.",
                userPrompt: text,
                leadId: leadId,
                tenantId: tenantId,
                context: {
                    channel: "whatsapp",
                    phone: from
                }
            }
        });

        if (aiError) {
            console.error("❌ Error invoking AI agent:", aiError);
            return;
        }

        const aiText = aiResponse?.result || "Desculpe, não consegui processar sua mensagem no momento.";

        // 6. Save Outgoing Message (AI Response)
        await supabase.from("whatsapp_messages").insert({
            conversation_id: conversationId,
            sender: "ia",
            content: aiText,
            message_type: "text",
            timestamp: new Date().toISOString()
        });

        // 7. Send Response via WhatsApp API
        await sendWhatsAppMessage(from, aiText, phoneNumberId);

    } catch (error) {
        console.error("❌ Error in processMessage:", error);
    }
}

async function sendWhatsAppMessage(to: string, text: string, phoneNumberId: string) {
    const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    // If phoneNumberId is not provided in env (multi-tenant), we might need to look it up or pass it.
    // For now, we use the one from the webhook payload or ENV if single tenant.
    // Ideally, the PhoneNumberID in the URL should match the one in the webhook.
    const idToSendFrom = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || phoneNumberId;

    if (!token || !idToSendFrom) {
        console.error("❌ Missing WhatsApp credentials for sending");
        return;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${idToSendFrom}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: to,
                    type: "text",
                    text: { body: text },
                }),
            }
        );

        const data = await response.json();
        if (!response.ok) {
            console.error("❌ Error sending WhatsApp message:", data);
        } else {
            console.log("✅ WhatsApp message sent:", data.messages?.[0]?.id);
        }
    } catch (error) {
        console.error("❌ Network error sending WhatsApp message:", error);
    }
}
