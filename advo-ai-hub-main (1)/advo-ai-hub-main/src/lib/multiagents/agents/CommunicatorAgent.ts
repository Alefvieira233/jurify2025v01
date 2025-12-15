/**
 * 📱 AGENTE COMUNICADOR
 *
 * Especialista em comunicação multicanal (WhatsApp, Email, Chat).
 * Formata e envia mensagens de forma profissional.
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseAgent } from '../core/BaseAgent';
import { AgentMessage, MessageType, Priority, AGENT_CONFIG } from '../types';

export class CommunicatorAgent extends BaseAgent {
  constructor() {
    super(AGENT_CONFIG.NAMES.COMMUNICATOR, AGENT_CONFIG.IDS.COMMUNICATOR);
  }

  protected getSystemPrompt(): string {
    return `Você é especialista em comunicação. Formate mensagens para WhatsApp/Email, adapte linguagem, envie no momento ideal.`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    if (message.payload.task === 'send_proposal') {
      await this.sendProposal(message.payload);
    } else if (message.payload.task === 'send_onboarding') {
      await this.sendOnboarding(message.payload);
    }
  }

  private async sendProposal(payload: any): Promise<void> {
    const formatted = await this.processWithAI(
      `Formate esta proposta para WhatsApp: ${payload.proposal}. Use linguagem profissional e emojis apropriados.`
    );

    // Salva no banco
    await supabase.from('lead_interactions').insert({
      lead_id: payload.leadId,
      agent_id: this.agentId,
      message: 'Proposta enviada',
      response: formatted
    });

    this.updateContext(payload.leadId, { 
      stage: 'proposal_sent', 
      formatted_message: formatted 
    });
  }

  private async sendOnboarding(payload: any): Promise<void> {
    console.log('📱 Comunicador enviando onboarding...');

    const formattedMessage = await this.processWithAI(
      `Formate este plano de onboarding para envio ao cliente:

      Plano: ${payload.plan}

      Seja acolhedor, claro e organize as informações de forma visual.`,
      payload.client_data
    );

    console.log('📤 Onboarding formatado:', formattedMessage);
  }
}
