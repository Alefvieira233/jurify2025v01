# ✅ CHECKLIST DE CORREÇÕES PRIORITÁRIAS - JURIFY
**Data:** 12/01/2026 | **Objetivo:** Sistema 100% Funcional

---

## 🔴 CRÍTICO - FAZER AGORA (4-6 horas)

### 1️⃣ Google Calendar OAuth [⏱️ 1h]
**Status:** ❌ Não configurado
**Impacto:** Agendamentos não sincronizam

```bash
# ========================================
# PASSO A PASSO - GOOGLE CALENDAR
# ========================================

## PARTE 1: Google Cloud Console
1. Acesse: https://console.cloud.google.com
2. Criar novo projeto: "Jurify Production"
3. Habilitar APIs:
   - Google Calendar API
   - Google People API (opcional, para contatos)
4. Criar credenciais OAuth 2.0:
   - Tipo: Web application
   - Nome: Jurify Web Client
   - URIs autorizadas de redirect:
     * http://localhost:8080/auth/google/callback (dev)
     * https://seudominio.com/auth/google/callback (prod)
5. Copiar Client ID e Client Secret

## PARTE 2: Atualizar .env
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

## PARTE 3: Testar
npm run dev
# Ir em: Configurações > Integrações > Google Calendar > Conectar
```

**Arquivos afetados:**
- `src/hooks/useGoogleCalendar.ts` ✅ Já implementado
- `src/lib/google/GoogleOAuthService.ts` ✅ Já implementado
- `src/components/GoogleCalendarConfig.tsx` ✅ Já implementado

---

### 2️⃣ WhatsApp Business API [⏱️ 2h]
**Status:** ❌ Não configurado
**Impacto:** Mensagens WhatsApp não funcionam

```bash
# ========================================
# PASSO A PASSO - WHATSAPP
# ========================================

## PARTE 1: Meta Business (Facebook)
1. Acesse: https://business.facebook.com
2. Criar ou selecionar Business Account
3. Adicionar WhatsApp Business:
   - Produtos > WhatsApp > Começar
4. Configurar número de telefone:
   - Adicionar número ou usar número teste
5. Obter credenciais:
   - Access Token (Temporário)
   - Phone Number ID
   - Criar Permanent Access Token (recomendado)

## PARTE 2: Configurar Supabase Secrets
# ⚠️ NÃO colocar no .env (segurança)
# Usar Supabase CLI ou Dashboard

# Via CLI:
supabase secrets set WHATSAPP_TOKEN=EAAxxxxxxxxx
supabase secrets set WHATSAPP_PHONE_NUMBER_ID=123456789012345
supabase secrets set WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123

# Via Dashboard:
# Project > Settings > Edge Functions > Secrets

## PARTE 3: Configurar Webhook
1. No Meta App Dashboard:
   - Configurar webhook
   - URL: https://[projeto].supabase.co/functions/v1/whatsapp-webhook
   - Verify Token: meu_token_secreto_123
   - Eventos: messages, message_status

## PARTE 4: Testar Edge Function
supabase functions deploy whatsapp-webhook
supabase functions deploy send-whatsapp-message

# Testar localmente:
npm run dev
# Ir em: WhatsApp > Enviar mensagem teste
```

**Arquivos afetados:**
- `supabase/functions/send-whatsapp-message/` ✅ Já implementado
- `supabase/functions/whatsapp-webhook/` ⚠️ Verificar se existe
- `src/lib/integrations/EnterpriseWhatsApp.ts` ✅ Já implementado
- `src/hooks/useWhatsAppConversations.ts` ✅ Já implementado

---

### 3️⃣ OpenAI API (Agentes IA) [⏱️ 30min]
**Status:** ❌ Não configurado
**Impacto:** Agentes IA não funcionam

```bash
# ========================================
# PASSO A PASSO - OPENAI
# ========================================

## PARTE 1: OpenAI Platform
1. Acesse: https://platform.openai.com
2. Criar conta ou fazer login
3. Ir em: API Keys
4. Criar nova Secret Key
5. Copiar key (começa com sk-proj- ou sk-)
6. ⚠️ Configurar limites de gasto (Settings > Limits)

## PARTE 2: Configurar Supabase Secrets
# ⚠️ NUNCA colocar no .env frontend!
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

## PARTE 3: Testar
npm run dev
# Ir em: Agentes IA > Executar agente teste
# Verificar logs em: Logs > Agentes IA
```

**Arquivos afetados:**
- `src/lib/multiagents/` ✅ Sistema completo já implementado
- `src/hooks/useAgentesIA.ts` ✅ Já implementado
- Edge Functions que usam OpenAI ✅ Já preparadas

---

## 🟡 IMPORTANTE - FAZER ESTA SEMANA (3-4 horas)

### 4️⃣ Stripe (Billing/Pagamentos) [⏱️ 1h30]
**Status:** ❌ Parcialmente configurado
**Impacto:** Sistema de assinaturas não funciona

```bash
# ========================================
# PASSO A PASSO - STRIPE
# ========================================

## PARTE 1: Stripe Dashboard
1. Acesse: https://dashboard.stripe.com
2. Ativar conta (se necessário)
3. Developers > API Keys:
   - Copiar Publishable Key (pk_test_ ou pk_live_)
   - Copiar Secret Key (sk_test_ ou sk_live_)

## PARTE 2: Criar Produtos
1. Products > Add Product
2. Criar plano PRO:
   - Nome: Jurify Pro
   - Preço: R$ 297/mês (ou seu valor)
   - Recorrência: Mensal
   - Copiar Price ID (price_xxx)
3. Criar plano ENTERPRISE:
   - Nome: Jurify Enterprise
   - Preço: R$ 997/mês
   - Copiar Price ID (price_xxx)

## PARTE 3: Configurar Webhook
1. Developers > Webhooks > Add endpoint
2. URL: https://[projeto].supabase.co/functions/v1/stripe-webhook
3. Eventos:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
4. Copiar Webhook Secret (whsec_xxx)

## PARTE 4: Atualizar configurações
# .env (frontend - pode ser público)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_STRIPE_PRICE_PRO=price_xxxxx
VITE_STRIPE_PRICE_ENTERPRISE=price_xxxxx

# Supabase Secrets (backend - privado)
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

## PARTE 5: Testar
npm run dev
# Ir em: Planos > Escolher plano > Testar checkout
# Usar cartão teste: 4242 4242 4242 4242
```

---

### 5️⃣ ZapSign (Assinaturas Digitais) [⏱️ 45min]
**Status:** ❌ Não configurado
**Impacto:** Assinaturas de contratos não funcionam

```bash
# ========================================
# PASSO A PASSO - ZAPSIGN
# ========================================

## PARTE 1: Criar conta ZapSign
1. Acesse: https://zapsign.com.br
2. Criar conta
3. Ir em: Configurações > Integrações > API
4. Gerar API Token

## PARTE 2: Atualizar .env
VITE_ZAPSIGN_API_TOKEN=seu_token_aqui
VITE_ZAPSIGN_API_URL=https://api.zapsign.com.br/api/v1
VITE_ZAPSIGN_SANDBOX=false

# Para testes:
VITE_ZAPSIGN_SANDBOX=true
VITE_ZAPSIGN_API_URL=https://sandbox.zapsign.com.br/api/v1

## PARTE 3: Testar
npm run dev
# Ir em: Contratos > Criar contrato > Enviar para assinatura
```

---

### 6️⃣ Sentry (Monitoring) [⏱️ 30min]
**Status:** ❌ Não configurado
**Impacto:** Sem monitoramento de erros

```bash
# ========================================
# PASSO A PASSO - SENTRY
# ========================================

## PARTE 1: Sentry.io
1. Acesse: https://sentry.io
2. Criar conta ou fazer login
3. Criar novo projeto:
   - Plataforma: React
   - Nome: Jurify Production
4. Copiar DSN (formato: https://xxx@xxx.ingest.sentry.io/xxx)

## PARTE 2: Atualizar .env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

## PARTE 3: Verificar integração
# Sentry já está configurado em:
# - src/lib/sentry.ts ✅
# - src/App.tsx ✅

# Testar:
npm run dev
# Gerar erro intencional para ver no Sentry dashboard
```

---

## 🔵 OPCIONAL - MELHORIAS FUTURAS

### 7️⃣ Redis/Cache [⏱️ 1h]
```bash
# Opção 1: Upstash (Serverless Redis - Recomendado)
1. Acesse: https://upstash.com
2. Criar database Redis
3. Copiar connection string

# .env
VITE_REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379

# Opção 2: Redis Cloud
1. Acesse: https://redis.com/try-free
2. Criar database
3. Copiar connection string
```

### 8️⃣ SMTP/Email [⏱️ 30min]
```bash
# Opção: Resend (Recomendado)
1. Acesse: https://resend.com
2. Criar API Key
3. Configurar domínio (opcional)

# .env
VITE_RESEND_API_KEY=re_xxxxx
```

### 9️⃣ Tabela de Contatos Dedicada [⏱️ 2h]
```sql
-- Avaliar necessidade primeiro!
-- Atualmente Leads servem como Contatos
-- Criar apenas se houver requisito específico

-- Migration exemplo:
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES leads(id),
  nome_completo TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cargo TEXT,
  empresa TEXT,
  tipo TEXT CHECK (tipo IN ('cliente', 'parceiro', 'fornecedor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🧪 VALIDAÇÃO FINAL

### Checklist de Testes (Após todas configurações)

```bash
# ========================================
# TESTES DE VALIDAÇÃO
# ========================================

## 1. Leads
□ Criar novo lead
□ Editar lead existente
□ Deletar lead
□ Filtrar/buscar leads
□ Verificar paginação

## 2. Google Calendar
□ Conectar conta Google
□ Criar agendamento
□ Verificar evento criado no Google Calendar
□ Editar agendamento
□ Verificar sincronização

## 3. WhatsApp
□ Abrir painel WhatsApp
□ Ver conversas
□ Enviar mensagem teste
□ Verificar mensagem recebida no WhatsApp real
□ Testar resposta automática IA (se configurada)

## 4. Agentes IA
□ Listar agentes disponíveis
□ Executar agente Qualifier em lead
□ Verificar logs de execução
□ Testar resposta gerada

## 5. Contratos
□ Criar novo contrato
□ Vincular a lead/cliente
□ Enviar para assinatura (ZapSign)
□ Verificar email de assinatura recebido

## 6. Billing (Stripe)
□ Acessar página de planos
□ Clicar em assinar plano
□ Preencher dados de cartão teste
□ Verificar assinatura criada no Stripe Dashboard

## 7. Monitoramento
□ Verificar logs no Sentry
□ Gerar erro intencional
□ Confirmar erro aparece no Sentry Dashboard

## 8. Performance
□ Verificar tempo de carregamento inicial
□ Testar realtime (abrir 2 tabs, criar lead em uma, ver atualizar na outra)
□ Verificar responsividade mobile
```

---

## 📊 TRACKING DE PROGRESSO

### Status Atual
```
✅ Arquitetura       : 100% Completa
✅ Frontend          : 100% Implementado
✅ Backend (Supabase): 100% Configurado
⚠️ Integrações       : 0% Configuradas
⚠️ Sistema Geral     : 40% Funcional
```

### Meta Final
```
🎯 Integrações: 100% Configuradas
🎯 Sistema Geral: 100% Funcional
🎯 Testes: 100% Passando
🎯 Deploy: Produção
```

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

### DIA 1 (4-6 horas)
```
1. Google Calendar (1h)       ← Crítico para agendamentos
2. WhatsApp API (2h)           ← Crítico para comunicação
3. OpenAI (30min)              ← Crítico para IA
4. Testes básicos (1h)         ← Validar funcionalidades
```

### DIA 2 (3-4 horas)
```
5. Stripe (1h30)               ← Importante para billing
6. ZapSign (45min)             ← Importante para contratos
7. Sentry (30min)              ← Importante para produção
8. Testes completos (1h)       ← Validação final
```

### DIA 3 (Opcional, 2-3 horas)
```
9. Redis/Cache (1h)            ← Performance
10. SMTP (30min)               ← Emails
11. Melhorias UI/UX (1h)       ← Polish
```

---

## 📞 SUPORTE

### Documentação Oficial
- **Supabase:** https://supabase.com/docs
- **Google Calendar API:** https://developers.google.com/calendar
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp
- **OpenAI:** https://platform.openai.com/docs
- **Stripe:** https://stripe.com/docs
- **ZapSign:** https://docs.zapsign.com.br
- **Sentry:** https://docs.sentry.io

### Dicas Importantes
```
⚠️ Sempre usar modo teste/sandbox primeiro
⚠️ Nunca commitar .env com credenciais reais
⚠️ Credenciais sensíveis sempre em Supabase Secrets
⚠️ Testar cada integração individualmente
⚠️ Backup do banco antes de migrations grandes
```

---

**✅ Checklist criado com rigor de Dev Senior**
**🎯 Meta: Jurify 100% Operacional**

🚀 Bora deixar tudo funcionando!
