# 🚀 DEPLOY DA EDGE FUNCTION - agentes-ia-api

## 📋 Status Atual

✅ **Código da função existe:** `supabase/functions/agentes-ia-api/index.ts` (404 linhas)
❌ **Função NÃO está deployada:** Retornando 404 Not Found
⚠️  **Bloqueio:** Impede execução dos agentes IA

---

## 🔧 OPÇÃO 1: Deploy via CLI (Recomendado)

### Passo 1: Login no Supabase
```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
npx supabase login
```

Isso vai:
1. Abrir o navegador
2. Pedir para você autorizar o CLI
3. Salvar o token de acesso

### Passo 2: Link com o projeto
```bash
npx supabase link --project-ref yfxgncbopvnsltjqetxw
```

Quando pedir a senha do banco, use a senha que você configurou no Supabase Dashboard.

### Passo 3: Configurar secrets
```bash
npx supabase secrets set OPENAI_API_KEY=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
```

### Passo 4: Deploy da função
```bash
npx supabase functions deploy agentes-ia-api
```

### Passo 5: Testar
```bash
node testar-edge-function.mjs
```

---

## 🔧 OPÇÃO 2: Deploy via Dashboard (Mais Simples)

### Passo 1: Acessar Edge Functions
1. Acesse: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/functions
2. Clique em **"Create Function"**

### Passo 2: Configurar a função
- **Name:** `agentes-ia-api`
- **Runtime:** Deno
- **Code:** Copie todo o conteúdo de `supabase/functions/agentes-ia-api/index.ts`

### Passo 3: Configurar Secrets
1. Vá em: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/vault
2. Adicione:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `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`

### Passo 4: Deploy
Clique em **"Deploy Function"**

### Passo 5: Testar
```bash
node testar-edge-function.mjs
```

---

## 🔧 OPÇÃO 3: Deploy via CLI com Access Token (Sem Login Interativo)

Se você preferir não fazer login interativo, pode usar um Access Token:

### Passo 1: Gerar Access Token
1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em **"Generate New Token"**
3. Copie o token

### Passo 2: Configurar token
```bash
export SUPABASE_ACCESS_TOKEN=seu-token-aqui
```

**Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN="seu-token-aqui"
```

**Windows (CMD):**
```cmd
set SUPABASE_ACCESS_TOKEN=seu-token-aqui
```

### Passo 3: Link e Deploy
```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
npx supabase link --project-ref yfxgncbopvnsltjqetxw
npx supabase secrets set OPENAI_API_KEY=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
npx supabase functions deploy agentes-ia-api
```

---

## ✅ Verificação Pós-Deploy

Após fazer o deploy, execute:

```bash
node testar-edge-function.mjs
```

**Resultado esperado:**
```
✅ Agente encontrado: Qualificador Trabalhista
✅ Edge Function respondeu!
📋 Resposta: { resultado: "...", tokens_usados: 250, ... }
```

---

## 📊 O que a Edge Function faz?

A `agentes-ia-api` implementa:
- ✅ Rate limiting (100 req/min via Deno KV)
- ✅ Caching de respostas
- ✅ Integration com OpenAI (gpt-4o-mini)
- ✅ Fallback para N8N
- ✅ Logs estruturados em `logs_execucao_agentes`
- ✅ Mission Control updates em tempo real

---

## 🆘 Troubleshooting

### Erro: "Access token not provided"
→ Execute `npx supabase login` primeiro

### Erro: "Function not found" após deploy
→ Aguarde 30s e tente novamente (propagação)

### Erro: "OpenAI API key not configured"
→ Configure a secret OPENAI_API_KEY

### Erro: "Database password incorrect"
→ Use a senha do Database Settings no Supabase Dashboard

---

## 💡 Recomendação

**Use a OPÇÃO 1 (CLI)** se você:
- Quer automação futura
- Vai fazer updates frequentes
- Quer CI/CD

**Use a OPÇÃO 2 (Dashboard)** se você:
- Quer deploy rápido agora
- Não quer configurar CLI
- É deploy único

**Use a OPÇÃO 3 (Token)** se você:
- Quer automação sem navegador
- Está em ambiente headless
- Vai scriptar deploys

---

**Após escolher uma opção e fazer o deploy, me avise que eu valido se funcionou!** ✅
