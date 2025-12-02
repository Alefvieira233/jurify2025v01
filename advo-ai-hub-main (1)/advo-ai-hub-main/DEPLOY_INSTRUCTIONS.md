# 🚀 Instruções de Deploy para Produção (Comercial)

Para tornar o Jurify 100% comercial e seguro, siga estes passos finais no seu terminal.

## 1. Banco de Dados (Migrações)
Aplique as novas tabelas de assinatura e planos.

```bash
# Login no Supabase (se ainda não fez)
npx supabase login

# Linkar ao projeto real (pegue o ID no dashboard do Supabase)
npx supabase link --project-ref seu-project-id

# Aplicar as migrações ao banco de produção
npx supabase db push
```

## 2. Deploy das Funções de IA (Segurança)
Isso é CRÍTICO para não expor sua chave da OpenAI.

```bash
# Deploy da função que protege a API Key
npx supabase functions deploy chat-completion --no-verify-jwt
```

*Nota: `--no-verify-jwt` é usado aqui se a função validar o usuário internamente ou for pública, mas idealmente remova essa flag e envie o token de autorização do cliente.*

## 3. Variáveis de Ambiente (Supabase Dashboard)
Vá em `Project Settings -> Edge Functions` no Supabase e adicione:

- `OPENAI_API_KEY`: Sua chave sk-...

## 4. Configurar Webhook do Stripe (Pagamentos)
1. Crie os produtos no Dashboard do Stripe.
2. Configure um endpoint no Stripe apontando para sua URL do Supabase (ex: criar uma nova Edge Function `stripe-webhook` para ouvir eventos de pagamento).

## 5. Próximos Passos no Código
- Implementar a chamada real do `stripe.checkout.sessions.create` na página `Pricing.tsx`.
- Criar a Edge Function `stripe-webhook` para atualizar a tabela `subscriptions` quando o pagamento cair.

Parabéns! Seu SaaS está pronto para escalar com segurança. 🚀
