@echo off
echo.
echo ================================================
echo   DEPLOY EDGE FUNCTION - agentes-ia-api
echo ================================================
echo.

set SUPABASE_ACCESS_TOKEN=sbp_9e65aaca45f9e36a5a4fb68d358154e084d0ee8c

echo 1. Linkando projeto...
npx supabase link --project-ref yfxgncbopvnsltjqetxw

if errorlevel 1 (
    echo ERRO no link!
    pause
    exit /b 1
)

echo.
echo 2. Configurando secret OPENAI_API_KEY...
npx supabase secrets set OPENAI_API_KEY=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

if errorlevel 1 (
    echo ERRO ao configurar secret!
    pause
    exit /b 1
)

echo.
echo 3. Fazendo deploy da funcao...
npx supabase functions deploy agentes-ia-api

if errorlevel 1 (
    echo ERRO no deploy!
    pause
    exit /b 1
)

echo.
echo ================================================
echo   SUCESSO! Funcao deployada!
echo ================================================
echo.
echo Testando...
node testar-edge-function.mjs

pause
