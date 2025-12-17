Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY EDGE FUNCTION - agentes-ia-api" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$env:SUPABASE_ACCESS_TOKEN = "sbp_9e65aaca45f9e36a5a4fb68d358154e084d0ee8c"

Write-Host "1. Linkando projeto..." -ForegroundColor Yellow
npx supabase link --project-ref yfxgncbopvnsltjqetxw --password ""

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no link!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "2. Configurando secret OPENAI_API_KEY..." -ForegroundColor Yellow
npx supabase secrets set OPENAI_API_KEY=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

if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Nao foi possivel configurar secret via CLI" -ForegroundColor Yellow
    Write-Host "Configure manualmente em: https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/vault" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Fazendo deploy da funcao..." -ForegroundColor Yellow
npx supabase functions deploy agentes-ia-api

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no deploy!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  SUCESSO! Funcao deployada!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Testando..." -ForegroundColor Yellow
node testar-edge-function.mjs

Read-Host "Pressione Enter para sair"
