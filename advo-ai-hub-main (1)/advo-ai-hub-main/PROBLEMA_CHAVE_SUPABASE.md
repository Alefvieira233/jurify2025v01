# 🔍 PROBLEMA IDENTIFICADO: Chave Supabase Inválida

## ❌ O Problema

A Edge Function está retornando erro **401: Invalid JWT** porque a chave `VITE_SUPABASE_ANON_KEY` no arquivo `.env` não é uma chave JWT válida.

### Chave Atual (INCORRETA):
```
VITE_SUPABASE_ANON_KEY=sb_publishable_jvu12I9zYXOF6fPD1GdF2g_anT9DTUj
```

### Formato Esperado (CORRETO):
Uma chave JWT tem este formato:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl...muito longo...
```

## ✅ SOLUÇÃO: Pegar a Chave Correta do Dashboard

### Passo 1: Acesse o Dashboard do Supabase
```
https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/api
```

### Passo 2: Procure pela seção "Project API keys"

Você verá duas chaves importantes:

1. **anon / public key** (começa com `eyJhbG...`)
   - Use esta para `VITE_SUPABASE_ANON_KEY`
   - É a chave pública que o frontend usa

2. **service_role key** (também começa com `eyJhbG...`)
   - Use esta para `SUPABASE_SERVICE_ROLE_KEY`
   - É a chave privada com todos os privilégios

### Passo 3: Copie as Chaves COMPLETAS

⚠️ **IMPORTANTE**: As chaves são MUITO LONGAS (centenas de caracteres).
Copie TODO o conteúdo, não apenas o início!

### Passo 4: Atualize o arquivo `.env`

Abra o arquivo:
```
E:\Jurify\advo-ai-hub-main (1)\advo-ai-hub-main\.env
```

E substitua:

```env
# ANTES (INCORRETO)
VITE_SUPABASE_ANON_KEY=sb_publishable_jvu12I9zYXOF6fPD1GdF2g_anT9DTUj
SUPABASE_SERVICE_ROLE_KEY=sb_secret_fLfBA6I3NbiCQv1VmYiBeQ_4wQgMyF-

# DEPOIS (CORRETO - com as chaves do dashboard)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmemduY2JvcHZuc2x0anFldHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTgxNTMwMDAsImV4cCI6MjAxMzcyOTAwMH0.coloque_a_chave_real_aqui

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmemduY2JvcHZuc2x0anFldHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODE1MzAwMCwiZXhwIjoyMDEzNzI5MDAwfQ.coloque_a_chave_real_aqui
```

### Passo 5: Salve e Teste Novamente

Após salvar o .env com as chaves corretas:

```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
node teste-edge-function-direto.mjs
```

## 🔍 Como Saber se Está Correto?

Uma chave JWT válida tem exatamente **3 partes separadas por pontos**:

```
parte1.parte2.parte3
```

Exemplo:
```
eyJhbGciOiJI...  (header)
.
eyJpc3MiOiJz...  (payload)
.
SflKxwRJSMeK...  (signature)
```

## 📋 Checklist

Antes de testar novamente, verifique:

- [ ] Acessou o dashboard do Supabase
- [ ] Navegou para Settings > API
- [ ] Copiou a **anon key** COMPLETA (não só o início)
- [ ] Copiou a **service_role key** COMPLETA
- [ ] As chaves têm 3 partes separadas por pontos
- [ ] As chaves começam com `eyJ`
- [ ] Colou as chaves no `.env`
- [ ] Salvou o arquivo `.env`

## 🎯 Após Corrigir

Quando você atualizar as chaves corretas, o sistema vai funcionar 100%:

✅ Frontend vai conectar ao Supabase
✅ Autenticação vai funcionar
✅ Edge Functions vão responder
✅ Agentes IA vão executar
✅ Mission Control vai receber dados

---

**Me avise quando tiver copiado as chaves do dashboard!**
Vou testar tudo de novo para confirmar que está funcionando.
