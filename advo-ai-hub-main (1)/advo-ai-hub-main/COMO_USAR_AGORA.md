# 🚀 COMO USAR AGORA - Jurify Agentes IA

## ✅ O que foi feito

Criei um **sistema completo de validação e correção automática** para fazer os Agentes IA funcionarem 100%.

### 📦 Arquivos criados:

**8 Scripts de validação e teste:**
- `validar-chaves-supabase.mjs` ✅
- `validar-openai-api-key.mjs` ✅
- `validar-database-rls.mjs` ✅
- `validar-tenant-id-profiles.mjs` ✅
- `aplicar-migrations.mjs` ✅
- `teste-completo-agentes-ia.mjs` ✅
- `teste-mission-control-realtime.mjs` ✅
- `VALIDAR_TUDO.mjs` ✅ ← **Use este!**

**3 Migrations SQL:**
- Fix RLS em logs_execucao_agentes ✅
- Fix RLS em agent_executions ✅
- Popular tenant_id em profiles ✅

**2 Documentações:**
- `README_VALIDACAO_AGENTES_IA.md` ✅ ← Guia completo
- `COMO_USAR_AGORA.md` ✅ ← Este arquivo

---

## 🎯 COMECE AQUI

Execute UM ÚNICO comando:

```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
node VALIDAR_TUDO.mjs
```

Este script vai:
1. ✅ Validar suas chaves Supabase
2. ✅ Testar OpenAI API Key
3. ✅ Verificar RLS policies
4. ✅ Validar tenant_id
5. ✅ Testar agentes IA
6. ✅ Testar Mission Control
7. 📄 Gerar relatório consolidado

**Tempo:** ~1 minuto

---

## 🔍 O que pode acontecer

### Cenário 1: ❌ Chaves inválidas

```
❌ CHAVE INVÁLIDA detectada!
   Formato atual: sb_publishable_...
   Formato esperado: eyJhbGciOiJIUzI1...
```

**SOLUÇÃO:**
1. Acesse: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/api
2. Procure por "Project API keys"
3. Copie a chave **"anon public"** (muito longa, começa com `eyJ`)
4. Abra o arquivo `.env` (linha 6)
5. Substitua o valor de `VITE_SUPABASE_ANON_KEY`
6. Execute novamente: `node VALIDAR_TUDO.mjs`

---

### Cenário 2: ❌ RLS bloqueando

```
❌ logs_execucao_agentes: BLOQUEADO
   Policy: secure_logs_insert
   Erro: auth.uid() IS NOT NULL failed
```

**SOLUÇÃO AUTOMÁTICA:**
```bash
node aplicar-migrations.mjs
```

Este script vai:
- Criar policies que permitem service role inserir
- Popular tenant_id faltantes
- Gerar relatório de sucesso

Depois execute novamente:
```bash
node VALIDAR_TUDO.mjs
```

---

### Cenário 3: ✅ Tudo OK!

```
🎉 SISTEMA 100% OPERACIONAL!

✅ CHAVES SUPABASE       [OK]
✅ OPENAI API KEY        [OK]
✅ RLS POLICIES          [OK]
✅ TENANT_ID             [OK]
✅ EDGE FUNCTIONS        [OK]
✅ MISSION CONTROL       [OK]
```

**PARABÉNS!** 🎉

Agora você pode:

1. **Acessar o sistema:**
   ```
   http://localhost:3000
   ```

2. **Fazer login**

3. **Navegar para "Agentes IA"**

4. **Selecionar um agente**

5. **Enviar uma mensagem de teste:**
   ```
   "Fui demitido sem justa causa. Tenho direito a FGTS?"
   ```

6. **Ver a resposta em tempo real** ⚡

7. **Abrir Mission Control e ver a execução ao vivo** 📊

---

## 📊 Relatórios Gerados

Após executar `VALIDAR_TUDO.mjs`, você terá:

- `RELATORIO_FINAL_VALIDACAO.md` ← **Leia este primeiro**
- `RELATORIO_VALIDACAO_CHAVES.md`
- `RELATORIO_VALIDACAO_OPENAI.md`
- `RELATORIO_RLS_POLICIES.md`
- `RELATORIO_TENANT_ID.md`
- `RELATORIO_TESTE_AGENTES_IA.md`
- `RELATORIO_TESTE_MISSION_CONTROL.md`

---

## 🆘 Se algo der errado

1. **Leia o relatório consolidado:**
   ```
   cat RELATORIO_FINAL_VALIDACAO.md
   ```

2. **Veja o guia completo:**
   ```
   cat README_VALIDACAO_AGENTES_IA.md
   ```

3. **Execute scripts individuais:**
   ```bash
   # Validar só as chaves
   node validar-chaves-supabase.mjs

   # Validar só OpenAI
   node validar-openai-api-key.mjs

   # Validar só RLS
   node validar-database-rls.mjs
   ```

---

## 🎯 Checklist Rápido

Antes de executar `VALIDAR_TUDO.mjs`, certifique-se:

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] Frontend está rodando em `http://localhost:3000`
- [ ] Você tem as chaves do Supabase Dashboard
- [ ] OpenAI API Key está no `.env`

---

## 💡 Dicas

### Para testar apenas os agentes (sem tudo):
```bash
node teste-completo-agentes-ia.mjs
```

### Para aplicar apenas as migrations:
```bash
node aplicar-migrations.mjs
```

### Para validar tudo de novo:
```bash
node VALIDAR_TUDO.mjs
```

---

## 🎉 Resultado Final Esperado

Quando tudo estiver OK, você verá:

```
═══════════════════════════════════════════════════════════
🎉 SISTEMA 100% OPERACIONAL!
═══════════════════════════════════════════════════════════

✅ CHAVES SUPABASE       [OK]
✅ OPENAI API KEY        [OK]
✅ RLS POLICIES          [OK]
✅ TENANT_ID             [OK]
✅ EDGE FUNCTIONS        [OK]
✅ MISSION CONTROL       [OK]

═══════════════════════════════════════════════════════════

🚀 PRÓXIMOS PASSOS:

   1. Acesse: http://localhost:3000
   2. Faça login no sistema
   3. Navegue para Agentes IA
   4. Selecione um agente e teste
   5. Veja Mission Control em tempo real
```

---

## 🚀 Comando Único Para Começar

```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main" && node VALIDAR_TUDO.mjs
```

**É só isso!** 🎯

O script vai te guiar pelo resto. Se encontrar problemas, ele vai te dizer exatamente o que fazer.

---

**Boa sorte!** 🚀

Se tudo correr bem, em 1 minuto você terá os Agentes IA funcionando perfeitamente!
