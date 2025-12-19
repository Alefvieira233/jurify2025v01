# 📱 Guia de Configuração do WhatsApp IA

## ✅ PASSO 1: Criar Tabela no Banco de Dados

### Verificar se a tabela já existe

Execute no SQL Editor do Supabase:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'whatsapp_conversations';
```

**Se retornar vazio**, execute o SQL abaixo para criar a tabela.

### SQL para criar tabela `whatsapp_conversations`

**Arquivo:** `supabase/migrations/create_whatsapp_conversations.sql`

O arquivo já existe no projeto! Você pode:

**Opção A - Via Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto Jurify
3. Vá em **SQL Editor**
4. Abra o arquivo `supabase/migrations/create_whatsapp_conversations.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **RUN**

**Opção B - Via CLI:**
```bash
cd "E:\Jurify\advo-ai-hub-main (1)\advo-ai-hub-main"
supabase db push
```

---

## ✅ PASSO 2: Verificar Tabela `whatsapp_sessions`

A tabela de sessões já deve existir (criada em `20251211000000_whatsapp_tables.sql`).

Verifique com:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'whatsapp_sessions';
```

Se não existir, execute:

```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number TEXT,
  qr_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  session_data JSONB,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_tenant_id ON public.whatsapp_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON public.whatsapp_sessions(status);

-- RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions from their tenant"
  ON public.whatsapp_sessions FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert sessions in their tenant"
  ON public.whatsapp_sessions FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update sessions from their tenant"
  ON public.whatsapp_sessions FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
```

---

## ✅ PASSO 3: Criar Edge Function (Backend)

### Verificar se existe

```bash
ls -la supabase/functions/whatsapp-generate-qr
```

Se não existir, crie:

```bash
mkdir -p "supabase/functions/whatsapp-generate-qr"
```

### Criar arquivo `index.ts`

**Caminho:** `supabase/functions/whatsapp-generate-qr/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Buscar tenant_id do usuário
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      throw new Error('Tenant not found')
    }

    // TODO: Integração real com WhatsApp Web API
    // Por enquanto, gera QR Code mock
    const sessionId = crypto.randomUUID()
    const mockQRCode = `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" fill="white"/>
        <text x="128" y="128" text-anchor="middle" font-size="12" fill="black">
          QR Code Mock
          Session: ${sessionId.substring(0, 8)}
        </text>
      </svg>
    `)}`

    // Salvar sessão no banco
    const { error: insertError } = await supabaseClient
      .from('whatsapp_sessions')
      .insert({
        id: sessionId,
        tenant_id: profile.tenant_id,
        qr_code: mockQRCode,
        status: 'pending'
      })

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        qrCode: mockQRCode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### Deploy da Edge Function

```bash
cd "E:\Jurify\advo-ai-hub-main (1)\advo-ai-hub-main"
supabase functions deploy whatsapp-generate-qr
```

---

## ✅ PASSO 4: Testar no Frontend

1. **Inicie o servidor dev:**
   ```bash
   npm run dev
   ```

2. **Acesse:** http://localhost:8080

3. **Vá para:** WhatsApp IA (menu lateral)

4. **Comportamentos esperados:**

   ### ✅ Se a tabela existe e está vazia:
   - Mostra: "Nenhuma conversa ativa"
   - Botão: "Conectar WhatsApp"

   ### ✅ Se der erro na query:
   - Mostra erro amigável
   - Botão: "Tentar novamente"
   - Botão: "Conectar WhatsApp"

   ### ✅ Se clicar em "Conectar WhatsApp":
   - Abre tela de configuração
   - Botão: "Gerar QR Code"
   - Após gerar: Mostra QR Code (mock por enquanto)

   ### ❌ NUNCA mais tela branca!
   - ErrorBoundary captura erros de renderização
   - Mostra interface de erro com opções de recuperação

---

## 🔍 Troubleshooting

### Tela branca ainda aparece?

**Abra o console do navegador (F12) e verifique:**

1. **Erro de rede?**
   - Verifique se o servidor dev está rodando
   - Confirme se as credenciais do Supabase estão corretas no `.env`

2. **Erro de autenticação?**
   - Faça logout e login novamente
   - Verifique se o token não expirou

3. **Erro de query?**
   - Confirme que a tabela `whatsapp_conversations` foi criada
   - Execute: `SELECT * FROM whatsapp_conversations LIMIT 1;` no SQL Editor

4. **Erro de importação?**
   - Execute: `npm run type-check`
   - Verifique se há erros de TypeScript

---

## 📊 Status Atual da Implementação

| Item | Status | Notas |
|------|--------|-------|
| Tabela `whatsapp_conversations` | ✅ SQL Pronto | `create_whatsapp_conversations.sql` |
| Tabela `whatsapp_sessions` | ✅ SQL Pronto | `20251211000000_whatsapp_tables.sql` |
| Hook `useWhatsAppConversations` | ✅ Implementado | Funcional |
| Componente `WhatsAppIA` | ✅ Atualizado | Com estados de erro/empty |
| Componente `WhatsAppSetup` | ✅ Criado | QR Code UI |
| ErrorBoundary | ✅ Implementado | Captura erros de renderização |
| Edge Function (backend) | ⚠️ Mock | Precisa integração real |
| Integração WhatsApp Web | ❌ Não implementado | Próximo passo |

---

## 🚀 Próximos Passos (Produção)

1. **Integrar biblioteca WhatsApp Web:**
   - Usar `whatsapp-web.js` ou `Baileys`
   - Implementar persistência de sessão
   - Gerenciar múltiplas instâncias

2. **Implementar webhook de mensagens:**
   - Edge Function para receber mensagens
   - Salvar em `whatsapp_messages`
   - Atualizar `whatsapp_conversations`

3. **Conectar com sistema de IA:**
   - Processar mensagens com agentes
   - Responder automaticamente
   - Qualificar leads

---

**Criado por:** Claude Code
**Data:** 18/12/2025
**Versão:** 1.0.0
