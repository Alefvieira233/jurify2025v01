import { BaseAgent } from '../core/BaseAgent';
import { AgentMessage, MessageType, Priority, AGENT_CONFIG } from '../types';

export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(AGENT_CONFIG.NAMES.COORDINATOR, AGENT_CONFIG.IDS.COORDINATOR);
  }

  protected getSystemPrompt(): string {
    return `Você é o Coordenador do sistema jurídico. Orquestre outros agentes, tome decisões estratégicas e monitore o progresso dos casos.`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        await this.planExecution(message.payload);
        break;
      case MessageType.STATUS_UPDATE:
        await this.monitorProgress(message.payload);
        break;
    }
  }

  private async planExecution(payload: any): Promise<void> {
    const plan = await this.processWithAI(
      `Analise este lead e crie um plano: ${payload.message}`,
      payload.context
    );

    this.updateContext(payload.leadId, { stage: 'planned', plan });

    await this.sendMessage(
      AGENT_CONFIG.NAMES.QUALIFIER,
      MessageType.TASK_REQUEST,
      { task: 'analyze_lead', leadId: payload.leadId, data: payload },
      Priority.HIGH
    );
  }

  private async monitorProgress(payload: any): Promise<void> {
    const { stage, leadId } = payload;
    
    switch (stage) {
      case 'qualified':
        await this.sendMessage(
          AGENT_CONFIG.NAMES.LEGAL,
          MessageType.TASK_REQUEST,
          { task: 'validate_case', leadId, data: payload },
          Priority.HIGH
        );
        break;
      case 'validated':
        await this.sendMessage(
          AGENT_CONFIG.NAMES.COMMERCIAL,
          MessageType.TASK_REQUEST,
          { task: 'create_proposal', leadId, data: payload },
          Priority.HIGH
        );
        break;
    }
  }
}
