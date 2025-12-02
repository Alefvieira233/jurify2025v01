/**
 * 🚀 JURIFY MULTIAGENT SYSTEM - VERSÃO CORRIGIDA - SPACEX ENTERPRISE
 * 
 * Versão corrigida do sistema multiagentes com fixes críticos de arquitetura,
 * performance, segurança e integração.
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';

// 🎯 CONSTANTES DO SISTEMA
export const AGENT_NAMES = {
  COORDINATOR: 'Coordenador',
  QUALIFIER: 'Qualificador',
  LEGAL: 'Juridico',
  COMMERCIAL: 'Comercial',
  ANALYST: 'Analista',
  COMMUNICATOR: 'Comunicador',
  CUSTOMER_SUCCESS: 'CustomerSuccess'
} as const;

// 🔒 VALIDAÇÃO DE CONFIGURAÇÃO
class ConfigValidator {
  static validateEnvironment(): void {
    const requiredVars = ['OPENAI_API_KEY'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`);
    }
  }
}

// 🎯 TIPOS VALIDADOS
export enum MessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  DATA_SHARE = 'data_share',
  DECISION_REQUEST = 'decision_request',
  DECISION_RESPONSE = 'decision_response',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report'
}

export interface ValidatedLeadData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  legal_area?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  source: 'whatsapp' | 'email' | 'chat' | 'form';
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  payload: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requires_response: boolean;
}

// 🧠 CONTEXTO COMPARTILHADO REAL
export class SharedContextManager {
  private static instance: SharedContextManager;
  private contexts: Map<string, any> = new Map();

  static getInstance(): SharedContextManager {
    if (!SharedContextManager.instance) {
      SharedContextManager.instance = new SharedContextManager();
    }
    return SharedContextManager.instance;
  }

  setContext(leadId: string, context: any): void {
    this.contexts.set(leadId, { ...this.contexts.get(leadId), ...context });
  }

  getContext(leadId: string): any {
    return this.contexts.get(leadId) || {};
  }

  updateContext(leadId: string, updates: any): void {
    const current = this.getContext(leadId);
    this.setContext(leadId, { ...current, ...updates });
  }

  clearContext(leadId: string): void {
    this.contexts.delete(leadId);
  }
}

// 🤖 INTERFACE BASE CORRIGIDA
export abstract class BaseAgentFixed {
  protected name: string;
  protected specialization: string;
  protected openai: OpenAI;
  private messageQueue: AgentMessage[] = [];
  private isProcessing = false;
  private contextManager: SharedContextManager;

  constructor(name: string, specialization: string) {
    ConfigValidator.validateEnvironment();
    
    this.name = name;
    this.specialization = specialization;
    this.contextManager = SharedContextManager.getInstance();
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  // 📨 Recebe mensagem (thread-safe)
  async receiveMessage(message: AgentMessage): Promise<void> {
    console.log(`🤖 ${this.name} recebeu mensagem de ${message.from}: ${message.type}`);
    
    // Validação da mensagem
    if (!this.validateMessage(message)) {
      console.error(`❌ Mensagem inválida recebida por ${this.name}`);
      return;
    }

    this.messageQueue.push(message);
    
    // Processa de forma não-bloqueante
    if (!this.isProcessing) {
      setImmediate(() => this.processMessagesAsync());
    }
  }

  // 🔒 Validação de mensagem
  private validateMessage(message: AgentMessage): boolean {
    return !!(
      message.id &&
      message.from &&
      message.to &&
      message.type &&
      message.timestamp &&
      message.priority
    );
  }

  // 🔄 Processamento assíncrono e paralelo
  private async processMessagesAsync(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // Processa mensagens em paralelo (limitado)
      const batchSize = 3;
      
      while (this.messageQueue.length > 0) {
        const batch = this.messageQueue.splice(0, batchSize);
        
        const promises = batch.map(async (message) => {
          try {
            await this.handleMessage(message);
          } catch (error) {
            console.error(`❌ Erro ao processar mensagem em ${this.name}:`, error);
            
            if (message.requires_response) {
              await this.sendMessage(
                message.from,
                MessageType.ERROR_REPORT,
                { error: error.message, original_message: message.id },
                'high'
              );
            }
          }
        });

        await Promise.allSettled(promises);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // 📤 Envio de mensagem com retry
  protected async sendMessage(
    to: string,
    type: MessageType,
    payload: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    retries: number = 3
  ): Promise<void> {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: this.name,
      to,
      type,
      payload,
      timestamp: new Date(),
      priority,
      requires_response: type.includes('request')
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await MultiAgentSystemFixed.getInstance().routeMessage(message);
        return;
      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou para ${this.name} -> ${to}:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // 🧠 IA com cache e rate limiting
  protected async processWithAI(
    prompt: string,
    context?: any,
    useCache: boolean = true
  ): Promise<string> {
    try {
      // Cache simples baseado em hash do prompt
      const cacheKey = this.hashPrompt(prompt);
      
      if (useCache && this.aiCache.has(cacheKey)) {
        console.log(`💾 Cache hit para ${this.name}`);
        return this.aiCache.get(cacheKey)!;
      }

      // Rate limiting
      await this.rateLimiter.acquire();

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Você é ${this.name}, especialista em ${this.specialization}. ${this.getSystemPrompt()}`
          },
          {
            role: "user",
            content: context ? `Contexto: ${JSON.stringify(context)}\n\nTarefa: ${prompt}` : prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const result = completion.choices[0]?.message?.content || 'Erro ao processar';

      // Salva no cache
      if (useCache) {
        this.aiCache.set(cacheKey, result);
      }

      return result;

    } catch (error) {
      console.error(`❌ Erro na IA para ${this.name}:`, error);
      throw error;
    }
  }

  // 💾 Cache simples para IA
  private aiCache = new Map<string, string>();
  
  private hashPrompt(prompt: string): string {
    return Buffer.from(prompt).toString('base64').substring(0, 32);
  }

  // ⏱️ Rate limiter simples
  private rateLimiter = {
    lastCall: 0,
    minInterval: 1000, // 1 segundo entre chamadas
    
    async acquire(): Promise<void> {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCall;
      
      if (timeSinceLastCall < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastCall)
        );
      }
      
      this.lastCall = Date.now();
    }
  };

  // 🔍 Contexto compartilhado
  protected getSharedContext(leadId: string): any {
    return this.contextManager.getContext(leadId);
  }

  protected updateSharedContext(leadId: string, updates: any): void {
    this.contextManager.updateContext(leadId, updates);
  }

  // Métodos abstratos
  protected abstract handleMessage(message: AgentMessage): Promise<void>;
  protected abstract getSystemPrompt(): string;
}

// 🚀 SISTEMA MULTIAGENTES CORRIGIDO
export class MultiAgentSystemFixed {
  private static instance: MultiAgentSystemFixed;
  private agents: Map<string, BaseAgentFixed> = new Map();
  private messageHistory: AgentMessage[] = [];
  private contextManager: SharedContextManager;

  private constructor() {
    this.contextManager = SharedContextManager.getInstance();
    this.initializeAgents();
  }

  static getInstance(): MultiAgentSystemFixed {
    if (!MultiAgentSystemFixed.instance) {
      MultiAgentSystemFixed.instance = new MultiAgentSystemFixed();
    }
    return MultiAgentSystemFixed.instance;
  }

  private initializeAgents(): void {
    console.log('🚀 Inicializando Sistema Multiagentes Corrigido...');

    // TODO: Implementar agentes corrigidos
    // this.agents.set(AGENT_NAMES.COORDINATOR, new CoordinatorAgentFixed());
    // ... outros agentes

    console.log(`✅ ${this.agents.size} agentes inicializados`);
  }

  // 📨 Roteamento com validação
  async routeMessage(message: AgentMessage): Promise<void> {
    // Validação
    if (!this.validateMessage(message)) {
      throw new Error(`Mensagem inválida: ${JSON.stringify(message)}`);
    }

    this.messageHistory.push(message);

    const targetAgent = this.agents.get(message.to);
    if (!targetAgent) {
      throw new Error(`Agente não encontrado: ${message.to}`);
    }

    await targetAgent.receiveMessage(message);
  }

  private validateMessage(message: AgentMessage): boolean {
    return !!(
      message.id &&
      message.from &&
      message.to &&
      message.type &&
      Object.values(MessageType).includes(message.type) &&
      message.timestamp &&
      ['low', 'medium', 'high', 'critical'].includes(message.priority)
    );
  }

  // 🎯 Processamento de lead validado
  async processLead(leadData: ValidatedLeadData, message: string, channel: string = 'whatsapp'): Promise<void> {
    // Validação de entrada
    this.validateLeadData(leadData);

    console.log('🎯 Sistema Multiagentes processando lead validado...');

    const leadId = leadData.id || `lead_${Date.now()}`;

    // Inicializa contexto compartilhado
    this.contextManager.setContext(leadId, {
      leadId,
      conversationHistory: [],
      leadData,
      currentStage: 'new',
      decisions: {},
      metadata: { channel, timestamp: new Date() }
    });

    // Envia para coordenador
    const coordinator = this.agents.get(AGENT_NAMES.COORDINATOR);
    if (coordinator) {
      await coordinator.receiveMessage({
        id: `init_${Date.now()}`,
        from: 'System',
        to: AGENT_NAMES.COORDINATOR,
        type: MessageType.TASK_REQUEST,
        payload: {
          message,
          leadId,
          leadData
        },
        timestamp: new Date(),
        priority: 'high',
        requires_response: false
      });
    }
  }

  private validateLeadData(leadData: ValidatedLeadData): void {
    if (!leadData.name || !leadData.message) {
      throw new Error('Lead deve ter nome e mensagem');
    }

    if (leadData.email && !this.isValidEmail(leadData.email)) {
      throw new Error('Email inválido');
    }

    if (leadData.phone && !this.isValidPhone(leadData.phone)) {
      throw new Error('Telefone inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?[\d\s\-\(\)]{10,}$/.test(phone);
  }

  // 🔍 Interface pública para acessar agentes
  getAgent(agentName: string): BaseAgentFixed | undefined {
    return this.agents.get(agentName);
  }

  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  // 📊 Estatísticas melhoradas
  getSystemStats(): any {
    return {
      total_agents: this.agents.size,
      messages_processed: this.messageHistory.length,
      active_agents: this.getAvailableAgents(),
      last_activity: this.messageHistory[this.messageHistory.length - 1]?.timestamp,
      message_types: this.getMessageTypeStats(),
      error_rate: this.calculateErrorRate()
    };
  }

  private getMessageTypeStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const message of this.messageHistory) {
      stats[message.type] = (stats[message.type] || 0) + 1;
    }
    
    return stats;
  }

  private calculateErrorRate(): number {
    const errorMessages = this.messageHistory.filter(m => m.type === MessageType.ERROR_REPORT);
    return this.messageHistory.length > 0 ? (errorMessages.length / this.messageHistory.length) * 100 : 0;
  }

  // 🧹 Limpeza de recursos
  cleanup(): void {
    this.messageHistory = [];
    this.contextManager = SharedContextManager.getInstance();
    console.log('🧹 Sistema multiagentes limpo');
  }
}

// 🚀 INSTÂNCIA GLOBAL CORRIGIDA
export const multiAgentSystemFixed = MultiAgentSystemFixed.getInstance();
