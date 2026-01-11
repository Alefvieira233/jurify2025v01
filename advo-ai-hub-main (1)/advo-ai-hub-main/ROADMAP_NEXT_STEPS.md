# 🗺️ ROADMAP - PRÓXIMOS PASSOS JURIFY

**Análise completa file a file realizada em:** 2026-01-09
**Status atual:** 65/100 (C+) → **Meta:** 95/100 (A)
**Arquivos analisados:** 252 TypeScript/React + 10 Edge Functions + 38 migrations

---

## 📊 RESUMO EXECUTIVO

### ✅ O QUE ESTÁ BEM

- ✅ **Arquitetura:** TypeScript strict, React 18, Supabase RLS
- ✅ **Features Core:** CRM, Pipeline, Agentes IA, Dashboard funcionam
- ✅ **Segurança:** Correções WA-001, WA-002, PAY-001, PAY-002, SEC-002 implementadas
- ✅ **Código limpo:** 0 erros TypeScript, ESLint configurado

### ⚠️ GAPS CRÍTICOS (Bloqueadores)

| Gap | Impacto | Tempo | Status |
|-----|---------|-------|--------|
| **Stripe não configurado** | 🔴 Sem receita | 30 min | BLOQUEADOR |
| **WhatsApp sem chaves** | 🔴 Feature principal quebrada | 1h | BLOQUEADOR |
| **Testes 2% cobertura** | 🔴 Deploy arriscado | 2 semanas | CRÍTICO |

### 🎯 ROADMAP

- **Semana 1-2:** Configurações + Features críticas (P0)
- **Semana 3-4:** Integrações + Persistência (P1)
- **Semana 5-8:** Testes + Qualidade (P1-P2)
- **Semana 9-12:** Performance + UX (P2-P3)

---

## 🔴 FASE 1: CONFIGURAÇÕES CRÍTICAS (Semana 1-2)

### P0.1 - Configurar Stripe (2-4 horas) ⏰ URGENTE

**Problema:**
- Price IDs não configurados (corrigido no código, falta setup)
- Secrets não definidos
- Webhook não testado

**Checklist:**
```bash
# 1. Criar conta Stripe (10 min)
https://dashboard.stripe.com/register

# 2. Criar produtos (20 min)
# - Produto 1: Jurify Pro (R$ 99/mês)
# - Produto 2: Jurify Enterprise (R$ 299/mês)
# Copiar Price IDs

# 3. Configurar .env (5 min)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
VITE_STRIPE_PRICE_PRO=price_...
VITE_STRIPE_PRICE_ENTERPRISE=price_...

# 4. Configurar Supabase Secrets (5 min)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# 5. Testar (30 min)
npm run dev
# Acesse /planos, clique "Assinar"
# Cartão: 4242 4242 4242 4242
```

**Arquivos envolvidos:**
- ✅ `src/pages/Pricing.tsx` - JÁ CORRIGIDO
- ✅ `supabase/functions/create-checkout-session/index.ts` - OK
- ✅ `supabase/functions/stripe-webhook/index.ts` - OK
- ⏳ `.env` - PRECISA CONFIGURAR

**Documentação:** `STRIPE_BILLING_FIX.md` + `QUICKSTART_STRIPE.md`

---

### P0.2 - Configurar WhatsApp API (2-4 horas) ⏰ URGENTE

**Problema:**
- Credenciais não configuradas
- Setup não salva no banco
- Webhook não validado

**Checklist:**
```bash
# 1. Registrar na Meta Business (1-2 horas)
https://business.facebook.com/
# - Criar Business
# - Adicionar WhatsApp Product
# - Obter Phone Number ID e Access Token

# 2. Configurar Supabase Secrets (5 min)
supabase secrets set WHATSAPP_ACCESS_TOKEN=EAA...
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=123...
supabase secrets set WHATSAPP_VERIFY_TOKEN=seu_token_secreto

# 3. Configurar Webhook na Meta (10 min)
# URL: https://yfxgncbopvnsltjqetxw.supabase.co/functions/v1/whatsapp-webhook
# Verify Token: use o mesmo do step 2
# Events: messages, message_status

# 4. Deploy Edge Functions (5 min)
supabase functions deploy whatsapp-webhook
supabase functions deploy send-whatsapp-message

# 5. Testar (30 min)
USER_TOKEN=seu_jwt npx tsx scripts/test-whatsapp-send.ts
```

**Arquivos envolvidos:**
- ✅ `supabase/functions/whatsapp-webhook/index.ts` - JÁ CORRIGIDO
- ✅ `supabase/functions/send-whatsapp-message/index.ts` - JÁ CORRIGIDO
- ⏳ `src/features/whatsapp/WhatsAppSetup.tsx` - PRECISA PERSISTÊNCIA

**Documentação:** `WHATSAPP_SECURITY_FIX.md`

---

### P0.3 - Implementar Persistência de Config (4-6 horas)

**Problema:**
- WhatsAppSetup não salva credenciais no banco
- Config é manual toda vez
- Sem validação de tokens

**O que fazer:**

#### Criar tabela `integrations`

```sql
-- Arquivo: supabase/migrations/20260109000001_create_integrations.sql

CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.profiles(tenant_id),
    integration_type TEXT NOT NULL, -- 'whatsapp', 'stripe', 'google_calendar'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, integration_type)
);

-- RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
    ON public.integrations FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own integrations"
    ON public.integrations FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Índices
CREATE INDEX idx_integrations_tenant ON public.integrations(tenant_id);
CREATE INDEX idx_integrations_type ON public.integrations(integration_type);
```

#### Atualizar WhatsAppSetup.tsx

```typescript
// src/features/whatsapp/WhatsAppSetup.tsx

// 1. Adicionar hook para carregar config salva
useEffect(() => {
  async function loadSavedConfig() {
    const { data, error } = await supabase
      .from('integrations')
      .select('config')
      .eq('integration_type', 'whatsapp')
      .single();

    if (data) {
      setPhoneNumberId(data.config.phone_number_id);
      setAccessToken(data.config.access_token ? '***' : '');
      setVerifyToken(data.config.verify_token ? '***' : '');
    }
  }

  loadSavedConfig();
}, []);

// 2. Atualizar handleSubmit
const handleSubmit = async () => {
  // Validar credenciais primeiro
  const isValid = await validateWhatsAppCredentials(phoneNumberId, accessToken);

  if (!isValid) {
    toast.error('Credenciais inválidas. Verifique e tente novamente.');
    return;
  }

  // Salvar no banco
  const { error } = await supabase
    .from('integrations')
    .upsert({
      integration_type: 'whatsapp',
      config: {
        phone_number_id: phoneNumberId,
        access_token: accessToken, // TODO: Criptografar!
        verify_token: verifyToken,
      },
      is_active: true,
      last_validated_at: new Date().toISOString(),
    });

  if (error) {
    toast.error('Erro ao salvar configuração');
    return;
  }

  toast.success('WhatsApp configurado com sucesso!');
};
```

#### Criar validador de credenciais

```typescript
// src/lib/integrations/validateWhatsAppCredentials.ts

export async function validateWhatsAppCredentials(
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}
```

**Tempo estimado:** 4-6 horas
**Prioridade:** P0 CRÍTICO

---

## 🟠 FASE 2: INTEGRAÇÕES E QUALIDADE (Semana 3-4)

### P1.1 - Completar Google Calendar (6-8 horas)

**Status Atual:**
- ✅ UI pronta (`GoogleCalendarConfig.tsx`)
- ✅ Hook implementado (`useGoogleCalendar.ts`)
- ❌ OAuth não funciona
- ❌ Sync bidirecional faltando

**Checklist:**

```bash
# 1. Criar projeto Google Cloud (30 min)
https://console.cloud.google.com/
# - Criar projeto "Jurify"
# - Habilitar Google Calendar API
# - Criar credenciais OAuth 2.0
# - Adicionar redirect URI: http://localhost:8080/auth/google/callback

# 2. Configurar .env (5 min)
VITE_GOOGLE_CLIENT_ID=123...apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-...
VITE_GOOGLE_CALENDAR_API_KEY=AIza...

# 3. Implementar OAuth completo (2-3 horas)
# Arquivo: src/lib/google/GoogleOAuthService.ts
# - Adicionar persistência de tokens
# - Implementar refresh token
# - Salvar em integrations table

# 4. Implementar sync bidirecional (3-4 horas)
# - Jurify → Google: Criar evento no Google ao criar agendamento
# - Google → Jurify: Webhook do Google Calendar (Cloud Function)
```

**Arquivos a modificar:**
1. `src/lib/google/GoogleOAuthService.ts` (407 linhas) - Adicionar persistência
2. `src/hooks/useGoogleCalendar.ts` - Implementar sync completo
3. Criar: `supabase/functions/google-calendar-webhook/index.ts`

**Tempo estimado:** 6-8 horas
**Prioridade:** P1 ALTA

---

### P1.2 - Incrementar Cobertura de Testes (2 semanas)

**Status Atual:**
- 📊 Cobertura: ~2% (5 arquivos de teste vs 252 arquivos)
- ⚠️ Vitest configurado mas sem testes
- ⚠️ Playwright configurado mas sem execução

**Meta:** 60% cobertura de código crítico

**Plano de Testes:**

#### Semana 1: Unit Tests (30 horas)

**Prioridade Alta (testes críticos):**
```typescript
// 1. Testes de Hooks (10 horas)
src/hooks/__tests__/
  ├── useWhatsAppConversations.test.ts ✅ CRIAR
  ├── useAgentEngine.test.ts ✅ CRIAR
  ├── useLeads.test.ts (já existe, expandir)
  ├── useAuth.test.ts ✅ CRIAR
  └── useSupabaseQuery.test.ts ✅ CRIAR

// 2. Testes de Integrações (10 horas)
src/lib/__tests__/
  ├── EnterpriseWhatsApp.test.ts ✅ CRIAR
  ├── MultiAgentSystem.test.ts ✅ CRIAR
  ├── AgentEngine.test.ts ✅ CRIAR
  └── rate-limiter.test.ts ✅ CRIAR (Edge Functions)

// 3. Testes de Componentes (10 horas)
src/features/__tests__/
  ├── whatsapp/WhatsAppIA.test.tsx ✅ CRIAR
  ├── billing/SubscriptionStatus.test.tsx ✅ CRIAR
  ├── ai-agents/AgentesIAManager.test.tsx ✅ CRIAR
  └── leads/LeadsPanel.test.tsx ✅ CRIAR
```

**Exemplo de teste robusto:**
```typescript
// src/hooks/__tests__/useWhatsAppConversations.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useWhatsAppConversations } from '../useWhatsAppConversations';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('useWhatsAppConversations', () => {
  it('should load conversations on mount', async () => {
    const mockData = [
      { id: '1', phone_number: '5511999999999', last_message: 'Olá' }
    ];

    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockData, error: null })
        })
      })
    });

    const { result } = renderHook(() => useWhatsAppConversations());

    await waitFor(() => {
      expect(result.current.conversations).toEqual(mockData);
    });
  });

  it('should send message via Edge Function', async () => {
    // ... teste de envio
  });

  it('should handle rate limit errors', async () => {
    // ... teste de rate limiting
  });
});
```

#### Semana 2: Integration & E2E Tests (20 horas)

```bash
# E2E Tests com Playwright (15 horas)
e2e/
  ├── auth.spec.ts (expandir)
  ├── leads.spec.ts (expandir)
  ├── whatsapp-flow.spec.ts ✅ CRIAR
  ├── billing-checkout.spec.ts ✅ CRIAR
  ├── agent-creation.spec.ts ✅ CRIAR
  └── dashboard-navigation.spec.ts ✅ CRIAR

# Integration Tests (5 horas)
src/tests/
  ├── stripe-integration.test.ts ✅ CRIAR
  ├── whatsapp-webhook.test.ts ✅ CRIAR
  └── ai-agent-flow.test.ts (expandir existente)
```

**Scripts package.json:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

**Tempo estimado:** 2 semanas (50 horas)
**Prioridade:** P1 ALTA

---

### P1.3 - Fixar Type Safety (1 semana)

**Problema:** 247 ocorrências de `any` no código

**Plano:**

#### Identificar e corrigir (20 horas)

```bash
# 1. Encontrar todos os any
grep -r "any" src/ --include="*.ts" --include="*.tsx" | wc -l
# Resultado: 247 ocorrências

# 2. Priorizar por impacto
# Alta prioridade: Edge Functions e hooks
# Média: Componentes
# Baixa: Tests e mocks
```

**Exemplos de correção:**

```typescript
// ❌ ANTES (stripe-webhook/index.ts:87)
async function manageSubscriptionStatusChange(
  supabase: any,  // ← any!
  subscriptionId: string,
  customerId: string
)

// ✅ DEPOIS
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

async function manageSubscriptionStatusChange(
  supabase: SupabaseClient<Database>,
  subscriptionId: string,
  customerId: string
): Promise<void>
```

**Gerar tipos do Supabase:**
```bash
supabase gen types typescript --project-id yfxgncbopvnsltjqetxw > src/types/database.types.ts
```

**Configurar tsconfig mais strict:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Tempo estimado:** 1 semana (20 horas)
**Prioridade:** P1 ALTA

---

## 🟡 FASE 3: FEATURES E INTEGRAÇÕES (Semana 5-8)

### P2.1 - Completar Zapsign Integration (4-6 horas)

**Status:**
- ✅ Edge Function criada
- ✅ Form de assinatura OK
- ❌ Webhook não integrado
- ❌ Status não atualiza

**Checklist:**

```typescript
// 1. Criar webhook handler (2 horas)
// Arquivo: supabase/functions/zapsign-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const payload = await req.json();

  // Validar signature
  const signature = req.headers.get('x-zapsign-signature');
  if (!validateSignature(payload, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const supabase = createClient(/* ... */);

  // Atualizar contrato
  if (payload.event === 'document.signed') {
    await supabase
      .from('contratos')
      .update({
        status: 'assinado',
        signed_at: new Date().toISOString(),
        zapsign_doc_id: payload.document_id
      })
      .eq('id', payload.metadata.contract_id);

    // Notificar usuário
    await sendNotification(payload.metadata.user_id, 'Contrato assinado!');
  }

  return new Response('OK', { status: 200 });
});
```

```typescript
// 2. Integrar com BD (2 horas)
// Arquivo: src/features/contracts/ContratosManager.tsx

const handleGenerateContract = async () => {
  // Gerar contrato via Zapsign
  const { data: zapDoc } = await supabase.functions.invoke('zapsign-integration', {
    body: {
      template_id: 'template_xxx',
      signers: [/* ... */]
    }
  });

  // Salvar no BD
  await supabase.from('contratos').insert({
    lead_id: selectedLead.id,
    tipo: 'consultoria',
    status: 'aguardando_assinatura',
    zapsign_doc_id: zapDoc.doc_token,
    valor: 1000.00
  });
};
```

**Tempo estimado:** 4-6 horas
**Prioridade:** P2 MÉDIA

---

### P2.2 - Implementar Rastreamento de Custos OpenAI (3-4 horas)

**Problema:**
```typescript
// src/lib/multiagents/core/MultiAgentSystem.ts:122-124
totalTokens: 0, // TODO: Implementar tracking de tokens
estimatedCost: 0 // TODO: Implementar cálculo de custo
```

**Solução:**

```typescript
// 1. Criar tabela de tracking (1 hora)
// Arquivo: supabase/migrations/20260109000002_create_ai_usage_tracking.sql

CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    execution_id TEXT,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    estimated_cost_usd DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_tenant ON public.ai_usage_tracking(tenant_id);
CREATE INDEX idx_ai_usage_date ON public.ai_usage_tracking(created_at);
```

```typescript
// 2. Implementar tracking (2-3 horas)
// Arquivo: src/lib/agents/TokenTracker.ts

export class TokenTracker {
  private static PRICING = {
    'gpt-4-turbo-preview': {
      input: 0.01 / 1000,  // $0.01 per 1K tokens
      output: 0.03 / 1000
    },
    'gpt-3.5-turbo': {
      input: 0.0005 / 1000,
      output: 0.0015 / 1000
    }
  };

  static calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = this.PRICING[model] || this.PRICING['gpt-4-turbo-preview'];
    return (
      promptTokens * pricing.input +
      completionTokens * pricing.output
    );
  }

  static async trackUsage(
    tenantId: string,
    userId: string,
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number }
  ) {
    const cost = this.calculateCost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await supabase.from('ai_usage_tracking').insert({
      tenant_id: tenantId,
      user_id: userId,
      model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.prompt_tokens + usage.completion_tokens,
      estimated_cost_usd: cost
    });

    return cost;
  }
}
```

```typescript
// 3. Integrar no ai-agent-processor (30 min)
// Arquivo: supabase/functions/ai-agent-processor/index.ts

const aiResponse = await processAIRequest(openai, aiRequest);

// ✅ ADICIONAR tracking
await TokenTracker.trackUsage(
  aiRequest.tenantId,
  user.id,
  aiResponse.model,
  aiResponse.usage
);
```

**Tempo estimado:** 3-4 horas
**Prioridade:** P2 MÉDIA (importante para controle de custos)

---

### P2.3 - Configurar Sentry Completo (2-3 horas)

**Status Atual:**
- ✅ Sentry inicializado
- ❌ DSN não configurado
- ❌ Sem rastreamento custom

**Checklist:**

```bash
# 1. Criar projeto Sentry (10 min)
https://sentry.io/signup/
# - Criar projeto "Jurify"
# - Copiar DSN

# 2. Configurar .env (5 min)
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 3. Adicionar rastreamento custom (1-2 horas)
```

```typescript
// src/lib/sentry.ts

import * as Sentry from '@sentry/react';

// Adicionar breadcrumbs customizados
export function trackWhatsAppMessage(from: string, preview: string) {
  Sentry.addBreadcrumb({
    category: 'whatsapp',
    message: `Message from ${from}`,
    data: { preview },
    level: 'info'
  });
}

export function trackAIInference(agentName: string, tokens: number) {
  Sentry.addBreadcrumb({
    category: 'ai',
    message: `AI inference by ${agentName}`,
    data: { tokens },
    level: 'info'
  });
}

export function trackStripeCheckout(planId: string, amount: number) {
  Sentry.addBreadcrumb({
    category: 'billing',
    message: `Checkout initiated for ${planId}`,
    data: { amount },
    level: 'info'
  });
}

// Rastrear performance de Edge Functions
export async function trackEdgeFunctionPerformance(
  functionName: string,
  fn: () => Promise<any>
) {
  const transaction = Sentry.startTransaction({
    op: 'edge-function',
    name: functionName
  });

  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
}
```

```typescript
// Usar nos componentes críticos
// src/features/whatsapp/WhatsAppIA.tsx

const handleSendMessage = async () => {
  trackWhatsAppMessage('agent', newMessage);

  try {
    await sendMessage(selectedConversation.id, newMessage, 'agent');
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: 'WhatsAppIA' },
      extra: { conversationId: selectedConversation.id }
    });
  }
};
```

**Tempo estimado:** 2-3 horas
**Prioridade:** P2 MÉDIA

---

## 🟢 FASE 4: PERFORMANCE E UX (Semana 9-12)

### P3.1 - Implementar Paginação (1 semana)

**Componentes sem paginação:**
1. `LeadsPanel.tsx` - Carrega TODOS os leads
2. `WhatsAppConversations` - Carrega TODAS as conversas
3. `AgentesIAManager.tsx` - Carrega TODOS os agentes
4. `ContratosManager.tsx` - Carrega TODOS os contratos

**Implementação padrão:**

```typescript
// Hook de paginação reutilizável
// src/hooks/usePagination.ts

export function usePagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[], count: number }>,
  pageSize = 50
) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPage = async (newPage: number) => {
    setLoading(true);
    try {
      const result = await fetchFunction(newPage, pageSize);
      setData(result.data);
      setTotalCount(result.count);
      setPage(newPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(0);
  }, []);

  return {
    data,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
    loading,
    nextPage: () => loadPage(page + 1),
    prevPage: () => loadPage(page - 1),
    goToPage: loadPage
  };
}
```

```typescript
// Usar no LeadsPanel
// src/features/leads/LeadsPanel.tsx

const fetchLeads = async (page: number, pageSize: number) => {
  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .range(page * pageSize, (page + 1) * pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

const { data: leads, page, totalPages, nextPage, prevPage } = usePagination(fetchLeads);
```

**Tempo estimado:** 1 semana (20 horas)
**Prioridade:** P3 BAIXA (mas importante)

---

### P3.2 - Lazy Loading de Componentes (3-4 horas)

**Componentes grandes para lazy load:**

```typescript
// src/App.tsx

import { lazy, Suspense } from 'react';

// ❌ ANTES: Import direto (aumenta bundle inicial)
import WhatsAppIA from '@/features/whatsapp/WhatsAppIA';
import AgentesIAManager from '@/features/ai-agents/AgentesIAManager';
import ContratosManager from '@/features/contracts/ContratosManager';

// ✅ DEPOIS: Lazy import
const WhatsAppIA = lazy(() => import('@/features/whatsapp/WhatsAppIA'));
const AgentesIAManager = lazy(() => import('@/features/ai-agents/AgentesIAManager'));
const ContratosManager = lazy(() => import('@/features/contracts/ContratosManager'));

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Usar com Suspense
<Route
  path="/whatsapp"
  element={
    <Suspense fallback={<PageLoader />}>
      <WhatsAppIA />
    </Suspense>
  }
/>
```

**Impacto esperado:**
- Bundle inicial: -40% (de ~800KB para ~480KB)
- First Contentful Paint: -30%
- Time to Interactive: -25%

**Tempo estimado:** 3-4 horas
**Prioridade:** P3 BAIXA

---

### P3.3 - Implementar Relatórios Gerenciais (1-2 semanas)

**Arquivo:** `src/features/reports/RelatoriosGerenciais.tsx` (framework pronto, dados não)

**Relatórios a implementar:**

1. **Relatório de Leads (2 dias)**
   - Total de leads por período
   - Taxa de conversão
   - Origem dos leads
   - Funil de vendas

2. **Relatório de Agentes IA (2 dias)**
   - Uso de tokens por agente
   - Custo por agente
   - Performance (tempo de resposta)
   - Taxa de escalação

3. **Relatório Financeiro (3 dias)**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - LTV (Lifetime Value)
   - Custos operacionais (OpenAI, WhatsApp)

4. **Relatório de WhatsApp (2 dias)**
   - Volume de mensagens
   - Taxa de resposta
   - Tempo médio de resposta
   - Satisfação (baseado em feedback)

**Exemplo de implementação:**

```typescript
// src/hooks/useLeadsReport.ts

export function useLeadsReport(startDate: Date, endDate: Date) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      // Total de leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Leads por status
      const { data: byStatus } = await supabase
        .from('leads')
        .select('status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const statusCount = byStatus.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      // Taxa de conversão
      const converted = statusCount['convertido'] || 0;
      const conversionRate = (converted / totalLeads) * 100;

      setData({
        totalLeads,
        byStatus: statusCount,
        conversionRate
      });
    }

    fetchReport();
  }, [startDate, endDate]);

  return data;
}
```

**Tempo estimado:** 1-2 semanas (40-80 horas)
**Prioridade:** P3 BAIXA

---

## 📋 CHECKLIST FINAL - PRODUCTION READY

### 🔴 CRÍTICO (Bloqueadores)

- [ ] Configurar Stripe (Price IDs + Secrets)
- [ ] Configurar WhatsApp API (Credenciais + Webhook)
- [ ] Implementar persistência de integrations
- [ ] Deploy de todas as Edge Functions
- [ ] Aplicar migration de rate_limits
- [ ] Testar fluxo completo de billing
- [ ] Testar fluxo completo de WhatsApp

### 🟠 IMPORTANTE (Pré-Launch)

- [ ] Cobertura de testes ≥ 60%
- [ ] Remover todos os `any` types
- [ ] Configurar Google Calendar
- [ ] Completar Zapsign webhook
- [ ] Configurar Sentry DSN
- [ ] Implementar tracking de custos OpenAI
- [ ] Criar pre-commit hooks (secretlint)

### 🟡 DESEJÁVEL (Post-Launch)

- [ ] Implementar paginação em todos os listados
- [ ] Lazy loading de componentes
- [ ] Relatórios gerenciais funcionais
- [ ] Performance optimization (bundle size)
- [ ] UX improvements (loading states, animations)
- [ ] Acessibilidade WCAG AA

---

## 📊 CRONOGRAMA ESTIMADO

| Fase | Duração | Itens | Status |
|------|---------|-------|--------|
| **Fase 1: Configurações** | 1-2 semanas | Stripe, WhatsApp, Persistência | ⏳ PRÓXIMO |
| **Fase 2: Qualidade** | 3-4 semanas | Testes, Type Safety, Integrações | ⏳ Aguardando |
| **Fase 3: Features** | 3-4 semanas | Zapsign, Tracking, Sentry | ⏳ Aguardando |
| **Fase 4: Performance** | 3-4 semanas | Paginação, Lazy Load, Relatórios | ⏳ Aguardando |

**Total estimado:** 10-14 semanas para enterprise-grade
**MVP funcional:** 2-4 semanas (Fase 1 + parte da Fase 2)

---

## 🎯 MÉTRICAS DE SUCESSO

### Score Atual vs Meta

| Métrica | Atual | Meta | Gap |
|---------|-------|------|-----|
| **Funcionalidade** | 90% | 100% | -10% |
| **Segurança** | 90% | 95% | -5% |
| **Testes** | 2% | 60% | -58% |
| **Performance** | 60% | 85% | -25% |
| **Documentação** | 80% | 90% | -10% |
| **Type Safety** | 40% | 95% | -55% |

**Score Geral:** 65/100 (C+) → **Meta:** 95/100 (A)

---

## 🚀 COMEÇAR AGORA

### Próximas 24 horas:

```bash
# 1. Stripe (30 min)
# - Criar conta
# - Criar produtos
# - Configurar .env

# 2. WhatsApp (2 horas)
# - Registrar na Meta
# - Obter credenciais
# - Configurar secrets

# 3. Deploy (30 min)
supabase functions deploy send-whatsapp-message
supabase functions deploy whatsapp-webhook
supabase functions deploy ai-agent-processor
supabase db push

# 4. Testar (1 hora)
npm run dev
# Testar /planos (Stripe)
# Testar /whatsapp (WhatsApp)
```

**Total:** ~4 horas para sistema 100% funcional em MVP! 🚀

---

**Documentado por:** Claude Sonnet 4.5
**Data:** 2026-01-09
**Versão:** 1.0.0
**Próxima revisão:** Após Fase 1 completada
