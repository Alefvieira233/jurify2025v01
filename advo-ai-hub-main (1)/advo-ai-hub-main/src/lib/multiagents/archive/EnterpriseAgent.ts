import { supabase } from '@/integrations/supabase/client';
import { AgentMessage, MessageType, Priority } from '../types';
import { EnterpriseValidator } from '../utils/EnterpriseValidator';
import { RateLimiter } from '../utils/RateLimiter';
import { AICache } from '../utils/AICache';
import { SharedContext } from './SharedContext';
import { getRouter } from '../utils/SystemAccessor';

export abstract class EnterpriseAgent {
  protected name: string;
  protected agentId: string;
  protected specialization: string = '';
  private messageQueue: AgentMessage[] = [];
  private isProcessing = false;
  private context = SharedContext.getInstance();
  private rateLimiter = new RateLimiter();
  private aiCache = new AICache();

  constructor(name: string, agentId: string) {
    EnterpriseValidator.validateEnvironment();
    
    this.name = name;
    this.agentId = agentId;
    
    console.log(`✅ ${name} inicializado`);
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    if (!this.validateMessage(message)) return;
    
    this.messageQueue.push(message);
    
    if (!this.isProcessing) {
      // Use setTimeout to yield to event loop
      setTimeout(() => this.processMessages(), 0);
    }
  }

  private validateMessage(message: AgentMessage): boolean {
    return !!(message.id && message.from && message.to && message.type);
  }

  private async processMessages(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const batch = this.messageQueue.splice(0, 3);
        
        await Promise.allSettled(
          batch.map(async (message) => {
            try {
              await this.handleMessage(message);
            } catch (error: any) {
              console.error(`❌ Erro em ${this.name}:`, error);
              
              if (message.requires_response) {
                await this.sendMessage(
                  message.from,
                  MessageType.ERROR_REPORT,
                  { error: error.message },
                  Priority.HIGH
                );
              }
            }
          })
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  protected async sendMessage(
    to: string,
    type: MessageType,
    payload: any,
    priority: Priority = Priority.MEDIUM
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

    // Runtime access to singleton via SystemAccessor
    await getRouter().routeMessage(message);
  }

  protected async processWithAI(prompt: string, context?: any): Promise<string> {
    const cacheKey = btoa(unescape(encodeURIComponent(prompt))).substring(0, 32);
    
    // Verifica cache
    const cached = this.aiCache.get(cacheKey);
    if (cached) return cached;

    // Rate limiting
    await this.rateLimiter.acquire(this.name);

    try {
      // 🔒 SECURITY: Call Edge Function instead of OpenAI directly
      const { data, error } = await supabase.functions.invoke('ai-agent-processor', {
        body: {
          agentName: this.name,
          agentSpecialization: this.specialization || 'Juridico',
          systemPrompt: this.getSystemPrompt(),
          userPrompt: prompt,
          context: context,
          model: 'gpt-4-turbo-preview'
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No data received from AI Edge Function');

      const result = data.result || 'Erro ao processar (sem resposta)';
      
      // Salva no cache
      this.aiCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Erro IA ${this.name}:`, error);
      throw error;
    }
  }

  protected getContext(leadId: string): any {
    return this.context.get(leadId);
  }

  protected updateContext(leadId: string, updates: any): void {
    this.context.set(leadId, updates);
  }

  protected abstract handleMessage(message: AgentMessage): Promise<void>;
  protected abstract getSystemPrompt(): string;
}
