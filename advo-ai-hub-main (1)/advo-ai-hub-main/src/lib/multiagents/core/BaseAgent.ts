/**
 * 🚀 JURIFY MULTIAGENT SYSTEM - BASE AGENT
 *
 * Classe base abstrata para todos os agentes.
 * Refatorada para usar Supabase Edge Function em vez de chamada direta à OpenAI.
 *
 * @version 2.0.0
 * @security Enterprise Grade - API keys protegidas
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AgentMessage,
  MessageType,
  MessagePriority,
  SharedContext,
  AgentAIRequest,
  AgentAIResponse,
  IAgent,
  Priority
} from '../types';

export abstract class BaseAgent implements IAgent {
  protected readonly name: string;
  protected readonly specialization: string;
  protected messageQueue: AgentMessage[] = [];
  protected context: SharedContext | null = null;
  protected isProcessing = false;

  // 🎯 Configurações de IA
  protected model: string = 'gpt-4-turbo-preview';
  protected temperature: number = 0.7;
  protected maxTokens: number = 1500;

  constructor(name: string, specialization: string) {
    this.name = name;
    this.specialization = specialization;
  }

  // 🏷️ Getters públicos
  public getName(): string {
    return this.name;
  }

  public getSpecialization(): string {
    return this.specialization;
  }

  // 📨 Recebe mensagem de outro agente
  public async receiveMessage(message: AgentMessage): Promise<void> {
    console.log(`🤖 ${this.name} recebeu mensagem de ${message.from}: ${message.type}`);

    this.messageQueue.push(message);

    if (!this.isProcessing) {
      await this.processMessages();
    }
  }

  // 📤 Envia mensagem para outro agente
  protected async sendMessage(
    to: string,
    type: MessageType,
    payload: unknown,
    priority: MessagePriority = Priority.MEDIUM
  ): Promise<void> {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      from: this.name,
      to,
      type,
      payload,
      timestamp: new Date(),
      priority,
      requires_response: type.toString().includes('request')
    };

    // Importa dinamicamente para evitar circular dependency
    const { MultiAgentSystem } = await import('./MultiAgentSystem');
    await MultiAgentSystem.getInstance().routeMessage(message);
  }

  // 🔄 Processa fila de mensagens
  private async processMessages(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          await this.handleMessage(message);
        } catch (error) {
          console.error(`❌ Erro ao processar mensagem em ${this.name}:`, error);

          if (message.requires_response) {
            const { MessageType } = await import('../types');
            await this.sendMessage(
              message.from,
              MessageType.ERROR_REPORT,
              {
                error: error instanceof Error ? error.message : 'Unknown error',
                original_message_id: message.id
              },
              Priority.HIGH
            );
          }
        }
      }
    }

    this.isProcessing = false;
  }

  // 🎯 Método abstrato para cada agente implementar
  protected abstract handleMessage(message: AgentMessage): Promise<void>;

  // 🧠 Usa IA para processar informação via Edge Function (SEGURO)
  protected async processWithAI(
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    try {
      console.log(`🧠 ${this.name} chamando Edge Function de IA...`);

      // Prepara payload para Edge Function
      const aiRequest: AgentAIRequest = {
        agentName: this.name,
        agentSpecialization: this.specialization,
        systemPrompt: this.getSystemPrompt(),
        userPrompt: prompt,
        context: context || {},
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        leadId: this.context?.leadId,
        tenantId: this.context?.metadata?.tenantId as string | undefined
      };

      // 🔐 Chama Edge Function (API key fica no servidor)
      const { data, error } = await supabase.functions.invoke<AgentAIResponse>(
        'ai-agent-processor',
        {
          body: aiRequest
        }
      );

      if (error) {
        console.error(`❌ Erro na Edge Function para ${this.name}:`, error);
        throw new Error(`AI processing failed: ${error.message}`);
      }

      if (!data || !data.result) {
        throw new Error('Invalid response from AI processor');
      }

      console.log(`✅ ${this.name} recebeu resposta da IA (${data.usage?.total_tokens || 0} tokens)`);

      return data.result;

    } catch (error) {
      console.error(`❌ Erro no processamento de IA para ${this.name}:`, error);
      throw error;
    }
  }

  // 📋 Prompt específico de cada agente (abstrato)
  protected abstract getSystemPrompt(): string;

  // 🔍 Atualiza contexto compartilhado
  protected updateSharedContext(updates: Partial<SharedContext>): void {
    if (this.context) {
      this.context = { ...this.context, ...updates };
    }
  }

  // 🔍 Alias para compatibilidade - atualiza contexto por leadId
  protected updateContext(leadId: string, updates: Record<string, any>): void {
    if (!this.context) {
      this.context = {
        leadId,
        messages: [],
        metadata: updates
      };
    } else {
      this.context.leadId = leadId;
      this.context.metadata = { ...this.context.metadata, ...updates };
    }
  }

  // 🎯 Define contexto inicial
  public setContext(context: SharedContext): void {
    this.context = context;
  }

  // 📊 Obtém contexto atual
  public getContext(): SharedContext | null {
    return this.context;
  }

  // ⚙️ Permite configurar parâmetros de IA
  protected configureAI(config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): void {
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
  }
}
