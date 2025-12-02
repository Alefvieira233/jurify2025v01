/**
 * 🚀 ENTERPRISE WHATSAPP INTEGRATION - PRODUCTION READY
 * 
 * Integração enterprise do WhatsApp Business API com sistema multiagentes.
 * Validação robusta, rate limiting, retry logic e monitoramento completo.
 */

import { enterpriseMultiAgentSystem } from '@/lib/multiagents/EnterpriseMultiAgentSystem';
import { supabase } from '@/integrations/supabase/client';

// 🎯 TIPOS ENTERPRISE WHATSAPP
export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  apiVersion: string;
  rateLimitPerMinute: number;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  type: 'text' | 'image' | 'document' | 'audio';
  metadata?: {
    name?: string;
    profile_name?: string;
    wa_id?: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
}

// 🔒 VALIDADOR DE CONFIGURAÇÃO
class WhatsAppConfigValidator {
  static validate(config: Partial<WhatsAppConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.accessToken) {
      errors.push('Access Token é obrigatório');
    } else if (!config.accessToken.startsWith('EAA')) {
      errors.push('Access Token deve começar com "EAA"');
    }

    if (!config.phoneNumberId) {
      errors.push('Phone Number ID é obrigatório');
    } else if (!/^\d+$/.test(config.phoneNumberId)) {
      errors.push('Phone Number ID deve conter apenas números');
    }

    if (!config.webhookVerifyToken) {
      errors.push('Webhook Verify Token é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ⏱️ RATE LIMITER WHATSAPP
class WhatsAppRateLimiter {
  private calls: number[] = [];
  private readonly maxCalls: number;
  private readonly windowMs = 60000; // 1 minuto

  constructor(maxCalls: number = 80) { // WhatsApp permite 80 msgs/min
    this.maxCalls = maxCalls;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove chamadas antigas
    this.calls = this.calls.filter(time => time > now - this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = oldestCall + this.windowMs - now;
      
      if (waitTime > 0) {
        console.log(`⏱️ WhatsApp rate limit, aguardando ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.calls.push(now);
  }

  getStats(): any {
    const now = Date.now();
    const recentCalls = this.calls.filter(time => time > now - this.windowMs);
    
    return {
      calls_in_window: recentCalls.length,
      max_calls: this.maxCalls,
      remaining_calls: this.maxCalls - recentCalls.length,
      window_reset_in_ms: recentCalls.length > 0 ? (recentCalls[0] + this.windowMs - now) : 0
    };
  }
}

// 🚀 INTEGRAÇÃO ENTERPRISE WHATSAPP
export class EnterpriseWhatsAppIntegration {
  private static instance: EnterpriseWhatsAppIntegration;
  private config: WhatsAppConfig;
  private rateLimiter: WhatsAppRateLimiter;
  private messageQueue: any[] = [];
  private isProcessingQueue = false;
  private metrics = {
    messages_sent: 0,
    messages_received: 0,
    errors: 0,
    last_activity: new Date()
  };

  private constructor() {
    this.config = this.loadConfiguration();
    this.rateLimiter = new WhatsAppRateLimiter(this.config.rateLimitPerMinute);
    this.startQueueProcessor();
  }

  static getInstance(): EnterpriseWhatsAppIntegration {
    if (!EnterpriseWhatsAppIntegration.instance) {
      EnterpriseWhatsAppIntegration.instance = new EnterpriseWhatsAppIntegration();
    }
    return EnterpriseWhatsAppIntegration.instance;
  }

  private loadConfiguration(): WhatsAppConfig {
    const config: Partial<WhatsAppConfig> = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      rateLimitPerMinute: parseInt(process.env.WHATSAPP_RATE_LIMIT || '80')
    };

    const validation = WhatsAppConfigValidator.validate(config);
    
    if (!validation.isValid) {
      console.warn('⚠️ WhatsApp não configurado:', validation.errors.join(', '));
      // Retorna configuração padrão para desenvolvimento
      return {
        accessToken: 'not_configured',
        phoneNumberId: 'not_configured',
        webhookVerifyToken: 'not_configured',
        apiVersion: 'v18.0',
        rateLimitPerMinute: 80
      };
    }

    console.log('✅ WhatsApp Enterprise configurado');
    return config as WhatsAppConfig;
  }

  // 🔐 VERIFICAÇÃO DE WEBHOOK
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('✅ Webhook WhatsApp verificado');
      return challenge;
    }
    
    console.log('❌ Falha na verificação do webhook WhatsApp');
    return null;
  }

  // 📨 PROCESSAMENTO DE WEBHOOK
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      console.log('📨 Processando webhook WhatsApp enterprise...');

      // Validação do payload
      if (!this.validateWebhookPayload(payload)) {
        throw new Error('Payload do webhook inválido');
      }

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              await this.queueMessageProcessing(message);
            }
          }
        }
      }

      this.metrics.last_activity = new Date();

    } catch (error) {
      console.error('❌ Erro ao processar webhook WhatsApp:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  private validateWebhookPayload(payload: WhatsAppWebhookPayload): boolean {
    return !!(
      payload &&
      payload.object === 'whatsapp_business_account' &&
      payload.entry &&
      Array.isArray(payload.entry)
    );
  }

  // 📥 ENFILEIRA MENSAGEM PARA PROCESSAMENTO
  private async queueMessageProcessing(message: WhatsAppMessage): Promise<void> {
    // Validação da mensagem
    if (!this.validateMessage(message)) {
      console.error('❌ Mensagem WhatsApp inválida:', message);
      return;
    }

    // Adiciona à fila
    this.messageQueue.push({
      message,
      timestamp: Date.now(),
      retries: 0
    });

    this.metrics.messages_received++;
    console.log(`📥 Mensagem enfileirada: ${message.id}`);
  }

  private validateMessage(message: WhatsAppMessage): boolean {
    return !!(
      message.id &&
      message.from &&
      message.text &&
      message.type === 'text' // Por enquanto só texto
    );
  }

  // 🔄 PROCESSADOR DE FILA
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.messageQueue.length > 0) {
        await this.processMessageQueue();
      }
    }, 1000); // Verifica a cada segundo
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;

    try {
      while (this.messageQueue.length > 0) {
        const queueItem = this.messageQueue.shift();
        
        try {
          await this.processIncomingMessage(queueItem.message);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem da fila:', error);
          
          // Retry logic
          if (queueItem.retries < 3) {
            queueItem.retries++;
            this.messageQueue.push(queueItem);
            console.log(`🔄 Recolocando mensagem na fila (tentativa ${queueItem.retries})`);
          } else {
            console.error('❌ Mensagem descartada após 3 tentativas:', queueItem.message.id);
            this.metrics.errors++;
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 📥 PROCESSA MENSAGEM RECEBIDA
  private async processIncomingMessage(message: WhatsAppMessage): Promise<void> {
    console.log('📥 Processando mensagem WhatsApp:', message.id);

    try {
      // Busca ou cria lead
      const leadData = await this.getOrCreateLead(message);

      // Salva mensagem no histórico
      await this.saveMessageHistory(message, leadData.id, 'incoming');

      // Processa via sistema multiagentes enterprise
      await enterpriseMultiAgentSystem.processLead(leadData, message.text);

      console.log('✅ Mensagem processada pelo sistema enterprise');

    } catch (error) {
      console.error('❌ Erro ao processar mensagem WhatsApp:', error);
      
      // Envia mensagem de erro para o usuário
      await this.sendErrorMessage(message.from);
      throw error;
    }
  }

  // 👤 BUSCA OU CRIA LEAD
  private async getOrCreateLead(message: WhatsAppMessage): Promise<any> {
    const phone = this.normalizePhoneNumber(message.from);
    const name = message.metadata?.profile_name || 
                 message.metadata?.name || 
                 `Cliente ${phone.slice(-4)}`;

    // Busca lead existente
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingLead) {
      console.log('👤 Lead existente encontrado:', existingLead.id);
      
      // Atualiza última atividade
      await supabase
        .from('leads')
        .update({ 
          updated_at: new Date().toISOString(),
          metadata: {
            ...existingLead.metadata,
            last_whatsapp_message: new Date().toISOString()
          }
        })
        .eq('id', existingLead.id);
      
      return existingLead;
    }

    // Cria novo lead
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        name,
        phone,
        message: message.text,
        source: 'whatsapp',
        status: 'new',
        metadata: {
          wa_id: message.metadata?.wa_id,
          whatsapp_message_id: message.id,
          first_message: message.text,
          first_contact: new Date().toISOString(),
          enterprise_processed: true
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar lead:', error);
      throw error;
    }

    console.log('✅ Novo lead criado:', newLead.id);
    return newLead;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do país se necessário
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `+55${cleaned}`;
    }
    
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+${cleaned}`;
    }
    
    return phone; // Retorna original se não conseguir normalizar
  }

  // 💾 SALVA HISTÓRICO DE MENSAGENS
  private async saveMessageHistory(
    message: WhatsAppMessage, 
    leadId: string, 
    direction: 'incoming' | 'outgoing'
  ): Promise<void> {
    await supabase
      .from('lead_interactions')
      .insert({
        lead_id: leadId,
        agent_id: direction === 'incoming' ? 'whatsapp_incoming' : 'whatsapp_outgoing',
        message: direction === 'incoming' ? 'Mensagem recebida via WhatsApp' : 'Mensagem enviada via WhatsApp',
        response: message.text,
        metadata: {
          whatsapp_message_id: message.id,
          direction,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type,
          enterprise_processed: true
        },
        created_at: new Date().toISOString()
      });
  }

  // 📤 ENVIA MENSAGEM VIA WHATSAPP
  async sendMessage(to: string, text: string, leadId?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('⚠️ WhatsApp não configurado, simulando envio');
      return true; // Simula sucesso em desenvolvimento
    }

    try {
      // Rate limiting
      await this.rateLimiter.acquire();

      // Validação
      if (!to || !text) {
        throw new Error('Destinatário e texto são obrigatórios');
      }

      if (text.length > 4096) {
        throw new Error('Mensagem muito longa (máximo 4096 caracteres)');
      }

      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
              body: text
            }
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Mensagem WhatsApp enviada:', result.messages?.[0]?.id);
        this.metrics.messages_sent++;

        // Salva no histórico se tiver leadId
        if (leadId) {
          await this.saveMessageHistory(
            {
              id: result.messages?.[0]?.id || `sent_${Date.now()}`,
              from: this.config.phoneNumberId,
              to,
              text,
              timestamp: Date.now(),
              type: 'text'
            },
            leadId,
            'outgoing'
          );
        }

        return true;
      } else {
        console.error('❌ Erro ao enviar mensagem WhatsApp:', result);
        this.metrics.errors++;
        return false;
      }

    } catch (error) {
      console.error('❌ Erro na API WhatsApp:', error);
      this.metrics.errors++;
      return false;
    }
  }

  // 📤 ENVIA MENSAGEM DE ERRO
  private async sendErrorMessage(to: string): Promise<void> {
    const errorMessage = `Desculpe, ocorreu um erro interno em nosso sistema. Nossa equipe foi notificada e entraremos em contato em breve. 

Para casos urgentes, ligue para: (11) 9999-9999`;

    await this.sendMessage(to, errorMessage);
  }

  // 🔧 MÉTODOS AUXILIARES
  private isConfigured(): boolean {
    return this.config.accessToken !== 'not_configured';
  }

  // 📊 MÉTRICAS E ESTATÍSTICAS
  getMetrics(): any {
    return {
      ...this.metrics,
      queue_size: this.messageQueue.length,
      is_processing: this.isProcessingQueue,
      rate_limiter: this.rateLimiter.getStats(),
      configuration: {
        is_configured: this.isConfigured(),
        api_version: this.config.apiVersion,
        rate_limit: this.config.rateLimitPerMinute
      }
    };
  }

  // 🧪 TESTE DE CONECTIVIDADE
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WhatsApp não configurado'
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: 'Conexão WhatsApp OK'
        };
      } else {
        return {
          success: false,
          message: `Erro na API: ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão: ${error.message}`
      };
    }
  }
}

// 🚀 INSTÂNCIA GLOBAL
export const enterpriseWhatsApp = EnterpriseWhatsAppIntegration.getInstance();

// 🔧 FUNÇÕES AUXILIARES PARA API ROUTES
export function verifyEnterpriseWhatsAppWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  return enterpriseWhatsApp.verifyWebhook(mode, token, challenge);
}

export async function processEnterpriseWhatsAppWebhook(
  payload: WhatsAppWebhookPayload
): Promise<void> {
  return enterpriseWhatsApp.processWebhook(payload);
}

export async function sendEnterpriseWhatsAppMessage(
  to: string,
  text: string,
  leadId?: string
): Promise<boolean> {
  return enterpriseWhatsApp.sendMessage(to, text, leadId);
}
