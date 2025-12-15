import { AgentMessage, MessageType, Priority, AGENT_CONFIG, LeadData, IMessageRouter } from '../types';
import { SharedContext } from './SharedContext';
import { EnterpriseAgent } from './EnterpriseAgent';
import { setRouter } from '../utils/SystemAccessor';

// Import concrete agents
import { CoordinatorAgent } from '../agents/CoordinatorAgent';
import { QualifierAgent } from '../agents/QualifierAgent';
import { LegalAgent } from '../agents/LegalAgent';
import { CommercialAgent } from '../agents/CommercialAgent';
import { CommunicatorAgent } from '../agents/CommunicatorAgent';

export class EnterpriseMultiAgentSystem implements IMessageRouter {
  private static instance: EnterpriseMultiAgentSystem;
  private agents = new Map<string, EnterpriseAgent>();
  private messageHistory: AgentMessage[] = [];

  private constructor() {
    setRouter(this);
    this.initializeAgents();
  }

  static getInstance(): EnterpriseMultiAgentSystem {
    if (!EnterpriseMultiAgentSystem.instance) {
      EnterpriseMultiAgentSystem.instance = new EnterpriseMultiAgentSystem();
    }
    return EnterpriseMultiAgentSystem.instance;
  }

  private initializeAgents(): void {
    console.log('🚀 Inicializando Sistema Enterprise...');

    this.agents.set(AGENT_CONFIG.NAMES.COORDINATOR, new CoordinatorAgent());
    this.agents.set(AGENT_CONFIG.NAMES.QUALIFIER, new QualifierAgent());
    this.agents.set(AGENT_CONFIG.NAMES.LEGAL, new LegalAgent());
    this.agents.set(AGENT_CONFIG.NAMES.COMMERCIAL, new CommercialAgent());
    this.agents.set(AGENT_CONFIG.NAMES.COMMUNICATOR, new CommunicatorAgent());

    console.log(`✅ ${this.agents.size} agentes enterprise inicializados`);
  }

  async routeMessage(message: AgentMessage): Promise<void> {
    this.messageHistory.push(message);

    const agent = this.agents.get(message.to);
    if (!agent) {
      throw new Error(`Agente não encontrado: ${message.to}`);
    }

    await agent.receiveMessage(message);
  }

  async processLead(leadData: LeadData, message: string): Promise<void> {
    const leadId = leadData.id || `lead_${Date.now()}`;
    
    // Inicializa contexto
    SharedContext.getInstance().set(leadId, {
      leadId,
      leadData,
      stage: 'new',
      created_at: new Date()
    });

    // Envia para coordenador
    const coordinator = this.agents.get(AGENT_CONFIG.NAMES.COORDINATOR);
    if (coordinator) {
      await coordinator.receiveMessage({
        id: `init_${Date.now()}`,
        from: 'System',
        to: AGENT_CONFIG.NAMES.COORDINATOR,
        type: MessageType.TASK_REQUEST,
        payload: { leadId, leadData, message },
        timestamp: new Date(),
        priority: Priority.HIGH,
        requires_response: false
      });
    }
  }

  getSystemStats(): any {
    return {
      total_agents: this.agents.size,
      messages_processed: this.messageHistory.length,
      active_agents: Array.from(this.agents.keys()),
      last_activity: this.messageHistory[this.messageHistory.length - 1]?.timestamp
    };
  }

  getAgent(name: string): EnterpriseAgent | undefined {
    return this.agents.get(name);
  }
}

export const enterpriseMultiAgentSystem = EnterpriseMultiAgentSystem.getInstance();
