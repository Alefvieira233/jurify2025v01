import { z } from 'zod';

// 🚀 SCHEMA ZOD PARA VALIDAÇÃO DE PAYLOADS N8N
export const n8nTestPayloadSchema = z.object({
  agente_id: z.string()
    .min(1, 'ID do agente é obrigatório')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'ID deve conter apenas letras, números, hífens e underscores'),
    
  nome_agente: z.string()
    .min(2, 'Nome do agente deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do agente deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s\-\.]+$/, 'Nome deve conter apenas letras, espaços, hífens e pontos'),
    
  input_usuario: z.string()
    .min(1, 'Input do usuário é obrigatório')
    .max(1000, 'Input deve ter no máximo 1000 caracteres'),
    
  prompt_base: z.string()
    .min(10, 'Prompt base deve ter pelo menos 10 caracteres')
    .max(5000, 'Prompt base deve ter no máximo 5000 caracteres'),
    
  area_juridica: z.string()
    .min(1, 'Área jurídica é obrigatória')
    .refine((val) => [
      'Direito Trabalhista',
      'Direito de Família', 
      'Direito Civil',
      'Direito Previdenciário',
      'Direito Criminal',
      'Direito Empresarial',
      'Teste'
    ].includes(val), 'Área jurídica inválida'),
    
  tipo_agente: z.enum(['chat_interno', 'analise_dados', 'api_externa', 'test'], {
    errorMap: () => ({ message: 'Tipo de agente inválido' })
  }),
  
  timestamp: z.number()
    .int('Timestamp deve ser um número inteiro')
    .positive('Timestamp deve ser positivo')
    .optional()
    .default(() => Date.now())
});

export const n8nWorkflowDataSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido').optional(),
  
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
    
  descricao: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
    
  webhook_url: z.string()
    .url('URL do webhook deve ser válida')
    .regex(/^https:\/\//, 'Webhook deve usar HTTPS'),
    
  ativo: z.boolean().default(true),
  
  configuracoes: z.object({
    timeout: z.number()
      .int('Timeout deve ser um número inteiro')
      .min(1000, 'Timeout mínimo é 1000ms')
      .max(30000, 'Timeout máximo é 30000ms')
      .default(10000),
      
    retry_attempts: z.number()
      .int('Tentativas de retry devem ser um número inteiro')
      .min(0, 'Tentativas mínimas é 0')
      .max(5, 'Tentativas máximas é 5')
      .default(3),
      
    headers: z.record(z.string()).optional().default({}),
    
    auth_required: z.boolean().default(false)
  }).default({
    timeout: 10000,
    retry_attempts: 3,
    headers: {},
    auth_required: false
  })
});

// Tipo TypeScript derivado dos schemas
export type N8NTestPayload = z.infer<typeof n8nTestPayloadSchema>;
export type N8NWorkflowData = z.infer<typeof n8nWorkflowDataSchema>;

// Função para validar payload de teste N8N
export const validateN8NTestPayload = (data: unknown) => {
  try {
    return {
      success: true,
      data: n8nTestPayloadSchema.parse(data),
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: 'Erro de validação desconhecido' }]
    };
  }
};

// Função para validar dados de workflow N8N
export const validateN8NWorkflowData = (data: unknown) => {
  try {
    return {
      success: true,
      data: n8nWorkflowDataSchema.parse(data),
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ field: 'unknown', message: 'Erro de validação desconhecido' }]
    };
  }
};