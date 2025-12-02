/**
 * 🚀 JURIFY MULTIAGENT SYSTEM - SPACEX ENTERPRISE GRADE
 * 
 * Sistema de multiagentes autônomos para automação jurídica completa.
 * Baseado na arquitetura do professor, mas adaptado para SaaS jurídico enterprise.
 * 
 * @author SpaceX Dev Team
 * @version 2.0.0
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';

// 🎯 TIPOS DE MENSAGENS ENTRE AGENTES
export enum MessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  DATA_SHARE = 'data_share',
  DECISION_REQUEST = 'decision_request',
  DECISION_RESPONSE = 'decision_response',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report'
}

// 📨 ESTRUTURA DE MENSAGEM ENTRE AGENTES
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

// 🧠 CONTEXTO COMPARTILHADO ENTRE AGENTES
export interface SharedContext {
  leadId: string;
  conversationHistory: any[];
  leadData: any;
  currentStage: string;
  decisions: Record<string, any>;
  metadata: Record<string, any>;
}

// 🤖 INTERFACE BASE DO AGENTE
export abstract class BaseAgent {
  protected name: string;
  protected specialization: string;
  protected openai: OpenAI;
  protected messageQueue: AgentMessage[] = [];
  protected context: SharedContext | null = null;
  protected isProcessing = false;

  constructor(name: string, specialization: string) {
    this.name = name;
    this.specialization = specialization;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 📨 Recebe mensagem de outro agente
  async receiveMessage(message: AgentMessage): Promise<void> {
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
    payload: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
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

    // Envia via sistema de mensagens
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
            await this.sendMessage(
              message.from,
              MessageType.ERROR_REPORT,
              { error: error.message, original_message: message.id },
              'high'
            );
          }
        }
      }
    }

    this.isProcessing = false;
  }

  // 🎯 Método abstrato para cada agente implementar
  protected abstract handleMessage(message: AgentMessage): Promise<void>;

  // 🧠 Usa IA para processar informação
  protected async processWithAI(prompt: string, context?: any): Promise<string> {
    try {
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

      return completion.choices[0]?.message?.content || 'Erro ao processar';

    } catch (error) {
      console.error(`❌ Erro na IA para ${this.name}:`, error);
      throw error;
    }
  }

  // 📋 Prompt específico de cada agente
  protected abstract getSystemPrompt(): string;

  // 🔍 Atualiza contexto compartilhado
  protected updateSharedContext(updates: Partial<SharedContext>): void {
    if (this.context) {
      this.context = { ...this.context, ...updates };
    }
  }
}

// 🎯 AGENTE COORDENADOR - Orquestra todo o sistema
export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super('Coordenador', 'Orquestração e planejamento de tarefas jurídicas');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Coordenador do sistema multiagentes jurídico. Suas responsabilidades:

1. ANALISAR mensagens de leads e determinar intenção
2. PLANEJAR sequência de ações necessárias
3. COORDENAR outros agentes especializados
4. MONITORAR progresso e tomar decisões estratégicas
5. ESCALAR problemas complexos quando necessário

Você deve ser estratégico, eficiente e sempre pensar no resultado final para o cliente.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        await this.planExecution(message.payload);
        break;
      
      case MessageType.STATUS_UPDATE:
        await this.monitorProgress(message.payload);
        break;
      
      case MessageType.DECISION_REQUEST:
        await this.makeDecision(message.payload);
        break;
    }
  }

  private async planExecution(payload: any): Promise<void> {
    console.log('🎯 Coordenador planejando execução...');

    const plan = await this.processWithAI(
      `Analise esta mensagem de lead e crie um plano de ação: ${payload.message}`,
      payload.context
    );

    // Envia tarefas para agentes especializados
    await this.sendMessage('Qualificador', MessageType.TASK_REQUEST, {
      task: 'analyze_lead',
      data: payload,
      plan
    }, 'high');
  }

  private async monitorProgress(payload: any): Promise<void> {
    console.log('📊 Coordenador monitorando progresso...');
    
    // Lógica de monitoramento e decisões baseadas no progresso
    if (payload.stage === 'qualified') {
      await this.sendMessage('Comercial', MessageType.TASK_REQUEST, {
        task: 'create_proposal',
        data: payload
      }, 'high');
    }
  }

  private async makeDecision(payload: any): Promise<void> {
    console.log('🤔 Coordenador tomando decisão...');

    const decision = await this.processWithAI(
      `Tome uma decisão baseada nestes dados: ${JSON.stringify(payload)}`,
      this.context
    );

    await this.sendMessage(payload.requesting_agent, MessageType.DECISION_RESPONSE, {
      decision,
      reasoning: 'Baseado em análise de contexto e histórico'
    });
  }
}

// 🔍 AGENTE QUALIFICADOR - Especialista em qualificação de leads
export class QualifierAgent extends BaseAgent {
  constructor() {
    super('Qualificador', 'Qualificação e análise de leads jurídicos');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Qualificador especialista em leads jurídicos. Suas responsabilidades:

1. ANALISAR perfil e necessidades do lead
2. IDENTIFICAR área jurídica específica
3. AVALIAR urgência e potencial de conversão
4. FAZER perguntas estratégicas para qualificação
5. DETERMINAR se lead deve seguir no funil

Áreas jurídicas: Trabalhista, Civil, Família, Previdenciário, Criminal, Empresarial.
Seja preciso, empático e focado em identificar oportunidades reais.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'analyze_lead') {
          await this.analyzeLead(message.payload);
        }
        break;
    }
  }

  private async analyzeLead(payload: any): Promise<void> {
    console.log('🔍 Qualificador analisando lead...');

    const analysis = await this.processWithAI(
      `Analise este lead e determine: área jurídica, urgência, potencial de conversão e próximos passos.
      
      Dados do lead: ${JSON.stringify(payload.data)}`,
      payload.context
    );

    // Envia resultado para Agente Jurídico para validação técnica
    await this.sendMessage('Juridico', MessageType.TASK_REQUEST, {
      task: 'validate_legal_case',
      analysis,
      original_data: payload.data
    });

    // Atualiza status no Coordenador
    await this.sendMessage('Coordenador', MessageType.STATUS_UPDATE, {
      stage: 'analyzed',
      analysis,
      next_action: 'legal_validation'
    });
  }
}

// ⚖️ AGENTE JURÍDICO - Especialista em direito
export class LegalAgent extends BaseAgent {
  constructor() {
    super('Juridico', 'Análise jurídica especializada e validação de casos');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Agente Jurídico especialista em direito brasileiro. Suas responsabilidades:

1. VALIDAR viabilidade jurídica dos casos
2. IDENTIFICAR precedentes e jurisprudência relevante
3. AVALIAR complexidade e tempo estimado
4. SUGERIR estratégias jurídicas adequadas
5. DETERMINAR documentação necessária

Você deve ser tecnicamente preciso, ético e sempre considerar as melhores práticas jurídicas.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'validate_legal_case') {
          await this.validateCase(message.payload);
        }
        break;
    }
  }

  private async validateCase(payload: any): Promise<void> {
    console.log('⚖️ Agente Jurídico validando caso...');

    const validation = await this.processWithAI(
      `Como especialista jurídico, valide este caso:
      
      Análise inicial: ${payload.analysis}
      Dados originais: ${JSON.stringify(payload.original_data)}
      
      Determine: viabilidade, complexidade, tempo estimado, documentos necessários, estratégia recomendada.`,
      this.context
    );

    // Se caso é viável, envia para Agente Comercial
    if (validation.includes('viável') || validation.includes('procedente')) {
      await this.sendMessage('Comercial', MessageType.TASK_REQUEST, {
        task: 'prepare_proposal',
        legal_validation: validation,
        case_data: payload
      });
    }

    // Atualiza Coordenador
    await this.sendMessage('Coordenador', MessageType.STATUS_UPDATE, {
      stage: 'legally_validated',
      validation,
      viable: validation.includes('viável')
    });
  }
}

// 💼 AGENTE COMERCIAL - Especialista em vendas e propostas
export class CommercialAgent extends BaseAgent {
  constructor() {
    super('Comercial', 'Vendas, propostas e fechamento de negócios');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Agente Comercial especialista em vendas jurídicas. Suas responsabilidades:

1. CRIAR propostas personalizadas e atrativas
2. CALCULAR valores baseados em complexidade e mercado
3. NEGOCIAR condições de pagamento
4. SUPERAR objeções com argumentos sólidos
5. FECHAR contratos e encaminhar para CS

Use técnicas de vendas consultivas, mostre valor e ROI, crie urgência apropriada.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'prepare_proposal') {
          await this.prepareProposal(message.payload);
        }
        break;
    }
  }

  private async prepareProposal(payload: any): Promise<void> {
    console.log('💼 Agente Comercial preparando proposta...');

    const proposal = await this.processWithAI(
      `Crie uma proposta comercial personalizada baseada em:
      
      Validação jurídica: ${payload.legal_validation}
      Dados do caso: ${JSON.stringify(payload.case_data)}
      
      Inclua: valor, prazo, forma de pagamento, entregáveis, garantias.`,
      this.context
    );

    // Envia proposta para Agente Comunicador formatar e enviar
    await this.sendMessage('Comunicador', MessageType.TASK_REQUEST, {
      task: 'send_proposal',
      proposal,
      lead_data: payload.case_data
    });

    // Atualiza Coordenador
    await this.sendMessage('Coordenador', MessageType.STATUS_UPDATE, {
      stage: 'proposal_created',
      proposal,
      next_action: 'send_to_client'
    });
  }
}

// 📊 AGENTE ANALISTA - Especialista em dados e insights
export class AnalystAgent extends BaseAgent {
  constructor() {
    super('Analista', 'Análise de dados, métricas e insights de negócio');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Agente Analista especialista em dados jurídicos. Suas responsabilidades:

1. ANALISAR padrões nos dados de leads e conversões
2. GERAR insights de performance dos agentes
3. IDENTIFICAR oportunidades de melhoria
4. CALCULAR métricas de ROI e eficiência
5. SUGERIR otimizações baseadas em dados

Seja analítico, preciso e focado em resultados mensuráveis.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'analyze_performance') {
          await this.analyzePerformance(message.payload);
        }
        break;
    }
  }

  private async analyzePerformance(payload: any): Promise<void> {
    console.log('📊 Agente Analista analisando performance...');

    // Busca dados do Supabase
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const analysis = await this.processWithAI(
      `Analise estes dados de leads dos últimos 30 dias e gere insights:
      
      Dados: ${JSON.stringify(leads)}
      
      Calcule: taxa de conversão, tempo médio de qualificação, áreas mais procuradas, ROI por canal.`,
      { leads }
    );

    // Compartilha insights com Coordenador
    await this.sendMessage('Coordenador', MessageType.DATA_SHARE, {
      type: 'performance_analysis',
      analysis,
      metrics: {
        total_leads: leads?.length || 0,
        period: '30_days'
      }
    });
  }
}

// 📱 AGENTE COMUNICADOR - Especialista em WhatsApp/Email
export class CommunicatorAgent extends BaseAgent {
  constructor() {
    super('Comunicador', 'Comunicação multicanal e formatação de mensagens');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Agente Comunicador especialista em comunicação jurídica. Suas responsabilidades:

1. FORMATAR mensagens para WhatsApp, Email e Chat
2. ADAPTAR linguagem para cada canal e contexto
3. ENVIAR mensagens no momento ideal
4. ACOMPANHAR entregas e respostas
5. ESCALAR problemas de comunicação

Seja claro, profissional e empático. Use emojis apropriados no WhatsApp.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'send_proposal') {
          await this.sendProposal(message.payload);
        }
        break;
    }
  }

  private async sendProposal(payload: any): Promise<void> {
    console.log('📱 Agente Comunicador enviando proposta...');

    const formattedMessage = await this.processWithAI(
      `Formate esta proposta para WhatsApp de forma profissional e atrativa:
      
      Proposta: ${payload.proposal}
      
      Use emojis apropriados, estruture bem o texto, inclua call-to-action.`,
      payload.lead_data
    );

    // Simula envio (implementar integração real)
    console.log('📤 Proposta formatada:', formattedMessage);

    // Salva no banco
    await supabase
      .from('lead_interactions')
      .insert({
        lead_id: payload.lead_data.leadId,
        agent_id: 'comunicador',
        message: 'Proposta comercial enviada',
        response: formattedMessage,
        created_at: new Date().toISOString()
      });

    // Confirma envio para Coordenador
    await this.sendMessage('Coordenador', MessageType.STATUS_UPDATE, {
      stage: 'proposal_sent',
      channel: 'whatsapp',
      message_id: `msg_${Date.now()}`
    });
  }
}

// 🎯 AGENTE CUSTOMER SUCCESS - Especialista em sucesso do cliente
export class CustomerSuccessAgent extends BaseAgent {
  constructor() {
    super('CustomerSuccess', 'Sucesso do cliente e acompanhamento pós-venda');
  }

  protected getSystemPrompt(): string {
    return `
Você é o Agente Customer Success especialista em sucesso do cliente jurídico. Suas responsabilidades:

1. REALIZAR onboarding eficiente de novos clientes
2. ACOMPANHAR progresso dos casos em andamento
3. IDENTIFICAR oportunidades de upsell e cross-sell
4. GARANTIR satisfação e retenção de clientes
5. RESOLVER problemas proativamente

Seja proativo, atencioso e focado no sucesso a longo prazo.
`;
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case MessageType.TASK_REQUEST:
        if (message.payload.task === 'onboard_client') {
          await this.onboardClient(message.payload);
        }
        break;
    }
  }

  private async onboardClient(payload: any): Promise<void> {
    console.log('🎯 Customer Success iniciando onboarding...');

    const onboardingPlan = await this.processWithAI(
      `Crie um plano de onboarding para este novo cliente:
      
      Dados do cliente: ${JSON.stringify(payload.client_data)}
      Serviço contratado: ${payload.service}
      
      Inclua: cronograma, documentos necessários, próximos passos, pontos de contato.`,
      payload
    );

    // Envia plano via Comunicador
    await this.sendMessage('Comunicador', MessageType.TASK_REQUEST, {
      task: 'send_onboarding',
      plan: onboardingPlan,
      client_data: payload.client_data
    });
  }
}

// 🚀 SISTEMA MULTIAGENTES PRINCIPAL
export class MultiAgentSystem {
  private static instance: MultiAgentSystem;
  private agents: Map<string, BaseAgent> = new Map();
  private messageHistory: AgentMessage[] = [];

  private constructor() {
    this.initializeAgents();
  }

  static getInstance(): MultiAgentSystem {
    if (!MultiAgentSystem.instance) {
      MultiAgentSystem.instance = new MultiAgentSystem();
    }
    return MultiAgentSystem.instance;
  }

  private initializeAgents(): void {
    console.log('🚀 Inicializando Sistema Multiagentes...');

    // Cria todos os agentes
    this.agents.set('Coordenador', new CoordinatorAgent());
    this.agents.set('Qualificador', new QualifierAgent());
    this.agents.set('Juridico', new LegalAgent());
    this.agents.set('Comercial', new CommercialAgent());
    this.agents.set('Analista', new AnalystAgent());
    this.agents.set('Comunicador', new CommunicatorAgent());
    this.agents.set('CustomerSuccess', new CustomerSuccessAgent());

    console.log(`✅ ${this.agents.size} agentes inicializados`);
  }

  // 📨 Roteamento de mensagens entre agentes
  async routeMessage(message: AgentMessage): Promise<void> {
    this.messageHistory.push(message);

    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      await targetAgent.receiveMessage(message);
    } else {
      console.error(`❌ Agente não encontrado: ${message.to}`);
    }
  }

  // 🎯 Ponto de entrada principal - processa lead
  async processLead(leadData: any, message: string, channel: string = 'whatsapp'): Promise<void> {
    console.log('🎯 Sistema Multiagentes processando lead...');

    const context: SharedContext = {
      leadId: leadData.id || `lead_${Date.now()}`,
      conversationHistory: [],
      leadData,
      currentStage: 'new',
      decisions: {},
      metadata: { channel, timestamp: new Date() }
    };

    // Envia tarefa inicial para Coordenador
    const coordinator = this.agents.get('Coordenador');
    if (coordinator) {
      await coordinator.receiveMessage({
        id: `init_${Date.now()}`,
        from: 'System',
        to: 'Coordenador',
        type: MessageType.TASK_REQUEST,
        payload: {
          message,
          context,
          leadData
        },
        timestamp: new Date(),
        priority: 'high',
        requires_response: false
      });
    }
  }

  // 📊 Obtém estatísticas do sistema
  getSystemStats(): any {
    return {
      total_agents: this.agents.size,
      messages_processed: this.messageHistory.length,
      active_agents: Array.from(this.agents.keys()),
      last_activity: this.messageHistory[this.messageHistory.length - 1]?.timestamp
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL DO SISTEMA
export const multiAgentSystem = MultiAgentSystem.getInstance();
