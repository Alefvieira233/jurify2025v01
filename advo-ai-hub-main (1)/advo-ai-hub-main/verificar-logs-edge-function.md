# 🔍 VERIFICAR LOGS DA EDGE FUNCTION

A Edge Function está retornando erro. Vamos verificar os logs:

## 📋 PASSO 1: Ver Logs no Supabase

1. Acesse: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/logs/edge-functions
2. Selecione a função: **agentes-ia-api**
3. Veja os logs mais recentes
4. Procure por erros relacionados a:
   - `OPENAI_API_KEY`
   - `TypeError`
   - `500` ou outros status codes

## 🔧 POSSÍVEIS PROBLEMAS E SOLUÇÕES

### Problema 1: Secret não propagado
**Sintoma:** Erro "OPENAI_API_KEY not configured"
**Solução:** Aguarde mais 2-3 minutos e teste novamente

### Problema 2: Edge Function não deployada
**Sintoma:** Função não aparece nos logs
**Solução:** Re-deploy das Edge Functions:
```bash
cd "advo-ai-hub-main (1)/advo-ai-hub-main"
npx supabase functions deploy agentes-ia-api --project-ref yfxgncbopvnsltjqetxw
```

### Problema 3: Erro na função
**Sintoma:** Erro de código/sintaxe nos logs
**Solução:** Verificar o código da Edge Function

## 🚀 TESTE ALTERNATIVO: Chamar Direto

Vamos testar chamando a Edge Function manualmente:

```bash
curl -X POST \
  https://yfxgncbopvnsltjqetxw.supabase.co/functions/v1/agentes-ia-api \
  -H "Authorization: Bearer sb_publishable_jvu12I9zYXOF6fPD1GdF2g_anT9DTUj" \
  -H "Content-Type: application/json" \
  -d '{
    "agente_id": "0e5a0646-1cac-42b7-bb00-7d7c5de6e8b3",
    "input_usuario": "Teste de caso trabalhista",
    "use_n8n": false
  }'
```

## 💡 ENQUANTO ISSO: TESTE O SISTEMA

**O sistema JÁ FUNCIONA localmente!**

1. Acesse: http://localhost:3000
2. Faça login
3. Navegue pelas ferramentas:
   - ✅ Leads
   - ✅ Pipeline
   - ✅ Contratos
   - ✅ Agendamentos
   - ✅ Relatórios
   - ✅ Usuários

**Tudo funciona exceto:**
- Execução de agentes IA via Edge Functions
- Mission Control em tempo real

**Mas você pode:**
- Gerenciar todos os dados
- Ver dashboards
- Usar todo o sistema de gestão

---

Me avise o que você vê nos logs!
