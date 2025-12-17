# 🚀 Guia de Validação e Correção - Agentes IA Jurify

## 📋 O que foi criado

Sistema completo de validação automática para fazer os Agentes IA funcionarem 100% no Jurify.

### ✅ Scripts de Validação (FASE 1)

1. **validar-chaves-supabase.mjs** - Valida se as chaves JWT do Supabase estão corretas
2. **validar-openai-api-key.mjs** - Testa se a OpenAI API Key funciona
3. **validar-database-rls.mjs** - Verifica se RLS permite service role
4. **validar-tenant-id-profiles.mjs** - Verifica se profiles têm tenant_id

### 🔐 Migrations SQL (FASE 2)

1. **20251217000000_fix_service_role_logs.sql** - Corrige RLS em logs_execucao_agentes
2. **20251217000001_fix_service_role_executions.sql** - Corrige RLS em agent_executions
3. **20251217000002_populate_missing_tenant_ids.sql** - Popular tenant_id faltantes

### 🗄️ Script de Aplicação (FASE 3)

1. **aplicar-migrations.mjs** - Aplica todas as migrations no Supabase

### 🧪 Scripts de Teste (FASE 4)

1. **teste-completo-agentes-ia.mjs** - Teste end-to-end de execução de agente
2. **teste-mission-control-realtime.mjs** - Testa updates em tempo real

### 🎯 Script Master (FASE 5)

1. **VALIDAR_TUDO.mjs** - Executa TODOS os testes em sequência

---

## 🚀 Como Usar

### Opção 1: Validação Completa (Recomendado)

Execute tudo de uma vez:

```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
node VALIDAR_TUDO.mjs
```

Este script vai:
- ✅ Validar todas as chaves
- ✅ Testar OpenAI
- ✅ Verificar RLS
- ✅ Validar tenant_id
- ✅ Testar agentes IA
- ✅ Testar Mission Control
- 📄 Gerar relatório consolidado

**Tempo estimado:** 30-60 segundos

---

### Opção 2: Passo a Passo

Se preferir executar manualmente cada etapa:

#### Passo 1: Validar Chaves Supabase

```bash
node validar-chaves-supabase.mjs
```

**Se falhar:**
1. Acesse: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/api
2. Copie a chave "anon / public" (JWT longa que começa com eyJ)
3. Cole no `.env` linha 6

---

#### Passo 2: Validar OpenAI

```bash
node validar-openai-api-key.mjs
```

**Se falhar:**
- Verifique se a API key está correta
- Teste em: https://platform.openai.com/api-keys

---

#### Passo 3: Validar RLS

```bash
node validar-database-rls.mjs
```

**Se encontrar tabelas bloqueadas:**

```bash
# Aplicar correções
node aplicar-migrations.mjs

# Validar novamente
node validar-database-rls.mjs
```

---

#### Passo 4: Validar tenant_id

```bash
node validar-tenant-id-profiles.mjs
```

Se encontrar profiles sem tenant_id, o script oferece popular automaticamente.

---

#### Passo 5: Testar Agentes IA

```bash
node teste-completo-agentes-ia.mjs
```

Este teste:
- Busca um agente
- Executa via Edge Function
- Valida resposta
- Verifica logs
- Mede performance

**Resultado esperado:** ✅ Resposta em <3s

---

#### Passo 6: Testar Mission Control

```bash
node teste-mission-control-realtime.mjs
```

Este teste:
- Conecta ao Realtime
- Executa agente
- Aguarda update
- Valida latência

**Resultado esperado:** ✅ Update em <1s

---

## 📄 Relatórios Gerados

Cada script gera um relatório em Markdown:

- `RELATORIO_VALIDACAO_CHAVES.md`
- `RELATORIO_VALIDACAO_OPENAI.md`
- `RELATORIO_RLS_POLICIES.md`
- `RELATORIO_TENANT_ID.md`
- `RELATORIO_MIGRATIONS.md`
- `RELATORIO_TESTE_AGENTES_IA.md`
- `RELATORIO_TESTE_MISSION_CONTROL.md`
- `RELATORIO_FINAL_VALIDACAO.md` ← **Consolidado**

---

## 🔍 Troubleshooting

### Erro: "CHAVE INVÁLIDA detectada"

**Causa:** Chave Supabase não é JWT

**Solução:**
1. Acesse o Dashboard do Supabase
2. Settings > API
3. Copie a chave JWT longa (não a que começa com `sb_publishable_`)
4. Cole no `.env`

---

### Erro: "logs_execucao_agentes: BLOQUEADO"

**Causa:** RLS policy exige `auth.uid()` mas service role não tem

**Solução:**
```bash
node aplicar-migrations.mjs
```

---

### Erro: "401 Unauthorized"

**Causas possíveis:**
1. Chave ANON_KEY inválida → Execute `validar-chaves-supabase.mjs`
2. RLS bloqueando → Execute `aplicar-migrations.mjs`
3. tenant_id NULL → Execute `validar-tenant-id-profiles.mjs`

---

### Erro: "OPENAI_API_KEY not found"

**Solução:**
1. Adicione no `.env` linha 14:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

2. Configure no Supabase Secrets (para Edge Functions):
   - Dashboard > Settings > Vault/Secrets
   - Adicione: `OPENAI_API_KEY` com o valor da chave

---

## ✅ Critérios de Sucesso

Após executar `node VALIDAR_TUDO.mjs`, você deve ver:

```
🎉 SISTEMA 100% OPERACIONAL!

✅ CHAVES SUPABASE       [OK]
✅ OPENAI API KEY        [OK]
✅ RLS POLICIES          [OK]
✅ TENANT_ID             [OK]
✅ EDGE FUNCTIONS        [OK]
✅ MISSION CONTROL       [OK]
```

Se ver isso, significa:
- ✅ Agentes IA podem ser executados
- ✅ Mission Control atualiza em tempo real
- ✅ Logs são salvos corretamente
- ✅ Sistema pronto para uso

---

## 🎯 Próximos Passos Após Validação 100%

1. **Testar no Browser:**
   ```
   http://localhost:3000
   ```

2. **Navegar para Agentes IA**

3. **Selecionar um agente e enviar mensagem:**
   ```
   "Fui demitido sem justa causa. Tenho direito a FGTS?"
   ```

4. **Ver resposta em tempo real**

5. **Abrir Mission Control e ver execução ao vivo**

---

## 📊 Estrutura de Arquivos

```
advo-ai-hub-main (1)/advo-ai-hub-main/
├── validar-chaves-supabase.mjs           # Valida chaves Supabase
├── validar-openai-api-key.mjs            # Valida OpenAI
├── validar-database-rls.mjs              # Valida RLS
├── validar-tenant-id-profiles.mjs        # Valida tenant_id
├── aplicar-migrations.mjs                # Aplica migrations
├── teste-completo-agentes-ia.mjs         # Teste E2E agentes
├── teste-mission-control-realtime.mjs    # Teste realtime
├── VALIDAR_TUDO.mjs                      # Script master
├── supabase/migrations/
│   ├── 20251217000000_fix_service_role_logs.sql
│   ├── 20251217000001_fix_service_role_executions.sql
│   └── 20251217000002_populate_missing_tenant_ids.sql
└── RELATORIO_FINAL_VALIDACAO.md          # Relatório consolidado
```

---

## 💡 Dicas

### Execução Rápida

Para validar rapidamente se tudo está OK:

```bash
node VALIDAR_TUDO.mjs
```

### Re-validação Após Correção

Se corrigiu algo, valide novamente:

```bash
node VALIDAR_TUDO.mjs
```

### Validar Apenas RLS

Se só quer testar RLS:

```bash
node validar-database-rls.mjs
```

### Validar Apenas Agentes

Se só quer testar agentes:

```bash
node teste-completo-agentes-ia.mjs
```

---

## 🎉 Status Final Esperado

Ao final de tudo, você deve ter:

1. ✅ **Todas as chaves validadas**
   - Supabase ANON_KEY (JWT)
   - Supabase SERVICE_ROLE_KEY (JWT)
   - OpenAI API KEY (sk-proj-...)

2. ✅ **RLS Policies corrigidas**
   - logs_execucao_agentes permite service role
   - agent_executions permite service role
   - agent_ai_logs permite service role

3. ✅ **Dados populados**
   - Todos os profiles têm tenant_id
   - Agentes IA cadastrados

4. ✅ **Edge Functions funcionando**
   - agentes-ia-api respondendo
   - Logs sendo criados
   - Performance < 3s

5. ✅ **Mission Control operacional**
   - Realtime conectado
   - Updates em tempo real
   - Latência < 1s

---

## 📞 Suporte

Se encontrar problemas:

1. Leia os relatórios gerados (*.md)
2. Verifique a seção Troubleshooting acima
3. Execute `node VALIDAR_TUDO.mjs` para diagnóstico completo

---

**Última atualização:** 17/12/2025
**Versão:** 1.0
**Autor:** Claude Code (Sonnet 4.5)
