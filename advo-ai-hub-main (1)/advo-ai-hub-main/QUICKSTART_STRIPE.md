# ⚡ QUICKSTART - Stripe Billing

**Configuração rápida do Stripe no Jurify**

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta no Stripe (https://stripe.com)
- [ ] Supabase CLI instalado
- [ ] Node.js 18+ instalado

---

## 🚀 SETUP RÁPIDO (5 minutos)

### 1. Obter API Keys do Stripe

```bash
# Acesse: https://dashboard.stripe.com/test/apikeys
# Copie:
# - Publishable key (pk_test_...)
# - Secret key (sk_test_...)
```

### 2. Criar Produtos

```bash
# Acesse: https://dashboard.stripe.com/test/products
# Crie dois produtos:

# PRODUTO 1: Jurify - Plano Profissional
# - Price: R$ 99 / mês (recurring)
# - Copie o Price ID: price_...

# PRODUTO 2: Jurify - Escritório Elite
# - Price: R$ 299 / mês (recurring)
# - Copie o Price ID: price_...
```

### 3. Configurar .env

```bash
# Edite o arquivo .env e adicione:

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
VITE_STRIPE_PRICE_PRO=price_1Q...
VITE_STRIPE_PRICE_ENTERPRISE=price_1Q...
```

### 4. Configurar Supabase Secrets

```bash
# Configure as chaves secretas (NUNCA no .env!)

supabase secrets set STRIPE_SECRET_KEY=sk_test_51...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...  # obtenha após criar webhook
```

### 5. Configurar Webhook

```bash
# Acesse: https://dashboard.stripe.com/test/webhooks
# Adicione endpoint:

# URL: https://yfxgncbopvnsltjqetxw.supabase.co/functions/v1/stripe-webhook

# Events:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded

# Copie o Signing Secret (whsec_...)
# E configure: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Deploy das Edge Functions

```bash
# Deploy das funções
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## 🧪 TESTAR

### Teste 1: Verificar Configuração

```bash
# Ver variáveis
cat .env | grep STRIPE

# Ver secrets
supabase secrets list
```

### Teste 2: Testar Checkout

```bash
# Iniciar app
npm run dev

# Acesse: http://localhost:8080/planos
# Clique em "Assinar Profissional"
# Use cartão de teste: 4242 4242 4242 4242
```

### Teste 3: Verificar Webhook

```bash
# Monitore logs
supabase functions logs stripe-webhook --tail

# Ou use Stripe CLI
stripe listen --forward-to https://yfxgncbopvnsltjqetxw.supabase.co/functions/v1/stripe-webhook
```

---

## 🎯 CARTÕES DE TESTE

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | ✅ Sucesso |
| 4000 0000 0000 0002 | ❌ Falha (cartão recusado) |
| 4000 0000 0000 9995 | ⏱️ Processamento lento |

**Dados adicionais:**
- Vencimento: Qualquer data futura (ex: 12/34)
- CVC: Qualquer 3 dígitos (ex: 123)
- CEP: Qualquer (ex: 12345)

---

## 🚨 PROBLEMAS COMUNS

### "Price ID não configurado"
```bash
# Verifique se o .env tem as variáveis
cat .env | grep STRIPE

# Reinicie o servidor
npm run dev
```

### "STRIPE_SECRET_KEY not configured"
```bash
# Configure o secret
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

### "Webhook signature verification failed"
```bash
# Configure o webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📚 MAIS INFORMAÇÕES

- 📄 Documentação completa: `STRIPE_BILLING_FIX.md`
- 🛠️ Setup interativo: `bash scripts/setup-stripe.sh`
- 🌐 Stripe Docs: https://stripe.com/docs

---

## ✅ CHECKLIST

- [ ] API Keys copiadas
- [ ] Produtos criados (2x)
- [ ] Price IDs copiados
- [ ] .env configurado
- [ ] Secrets configurados
- [ ] Webhook configurado
- [ ] Edge Functions deployadas
- [ ] Testado com cartão de teste
- [ ] Webhook recebendo eventos

**Status:** ✅ Pronto para produção quando todos os itens estiverem marcados!

---

**Versão:** 1.0.0
**Última atualização:** 2026-01-09
