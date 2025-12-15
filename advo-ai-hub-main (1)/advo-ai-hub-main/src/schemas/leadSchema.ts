import { z } from 'zod';

// Schema de validação para criação de Lead
export const leadFormSchema = z.object({
  nome_completo: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  telefone: z
    .string()
    .min(10, 'Telefone inválido')
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone inválido')
    .transform((val) => val.replace(/\D/g, ''))
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Email inválido')
    .max(200, 'Email muito longo')
    .optional()
    .or(z.literal('')),

  area_juridica: z
    .string()
    .min(1, 'Selecione uma área jurídica'),

  origem: z
    .string()
    .min(1, 'Selecione a origem do lead'),

  valor_causa: z
    .number()
    .min(0, 'Valor não pode ser negativo')
    .max(999999999, 'Valor muito alto')
    .optional()
    .nullable(),

  responsavel: z
    .string()
    .min(1, 'Informe o responsável'),

  observacoes: z
    .string()
    .max(2000, 'Observações muito longas')
    .optional()
    .or(z.literal('')),

  status: z
    .string()
    .default('novo_lead'),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// Opções de áreas jurídicas
export const AREAS_JURIDICAS = [
  'Direito Trabalhista',
  'Direito de Família',
  'Direito Civil',
  'Direito Previdenciário',
  'Direito Criminal',
  'Direito do Consumidor',
  'Direito Empresarial',
  'Direito Tributário',
  'Direito Imobiliário',
  'Outro',
] as const;

// Opções de origem do lead
export const ORIGENS_LEAD = [
  'WhatsApp',
  'Site',
  'Indicação',
  'Telefone',
  'Email',
  'Redes Sociais',
  'Google Ads',
  'Facebook Ads',
  'Instagram',
  'Evento',
  'Outro',
] as const;

// Status possíveis de lead
export const STATUS_LEAD = [
  'novo_lead',
  'em_qualificacao',
  'proposta_enviada',
  'contrato_assinado',
  'em_atendimento',
  'lead_perdido',
] as const;

export const STATUS_LABELS: Record<typeof STATUS_LEAD[number], string> = {
  novo_lead: 'Novo Lead',
  em_qualificacao: 'Em Qualificação',
  proposta_enviada: 'Proposta Enviada',
  contrato_assinado: 'Contrato Assinado',
  em_atendimento: 'Em Atendimento',
  lead_perdido: 'Lead Perdido',
};
