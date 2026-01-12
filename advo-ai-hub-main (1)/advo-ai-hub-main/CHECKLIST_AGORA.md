# ✅ CHECKLIST - CORREÇÕES CRÍTICAS (FAZER AGORA)

**Tempo estimado:** 2 horas
**Prioridade:** 🔴 CRÍTICO - Fazer antes do próximo commit

---

## 1️⃣ HABILITAR TYPESCRIPT STRICT RULES (30 min)

### Arquivo: `eslint.config.js`

**Encontrar linhas 31-38:**
```javascript
// ❌ ATUAL
"@typescript-eslint/no-unused-vars": "off",
"@typescript-eslint/no-explicit-any": "off",
"@typescript-eslint/no-unsafe-assignment": "off",
"@typescript-eslint/no-unsafe-member-access": "off",
"@typescript-eslint/no-unsafe-call": "off",
"@typescript-eslint/no-unsafe-return": "off",
"@typescript-eslint/no-unsafe-argument": "off",
```

**Substituir por:**
```javascript
// ✅ CORRIGIDO
"@typescript-eslint/no-unused-vars": ["warn", {
  argsIgnorePattern: "^_",
  varsIgnorePattern: "^_"
}],
"@typescript-eslint/no-explicit-any": "warn", // Começar com warn
"@typescript-eslint/no-unsafe-assignment": "off", // Manter off por enquanto
"@typescript-eslint/no-unsafe-member-access": "off",
"@typescript-eslint/no-unsafe-call": "off",
"@typescript-eslint/no-unsafe-return": "off",
"@typescript-eslint/no-unsafe-argument": "off",
```

**Testar:**
```bash
npm run lint
# Deve mostrar warnings de 'any' e unused vars
```

---

## 2️⃣ VERIFICAR .GITIGNORE (5 min)

### Arquivo: `.gitignore`

**Executar:**
```bash
# Verificar se .env está tracked
git status | grep ".env"
```

**Se aparecer `.env`:**
```bash
# CRÍTICO - Remover do git
git rm --cached .env
git rm --cached .env.BACKUP_SEGURO

# Adicionar ao .gitignore (se não estiver)
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.BACKUP" >> .gitignore
```

**Commit:**
```bash
git add .gitignore
git commit -m "security: Add .env to .gitignore"
```

---

## 3️⃣ ROTACIONAR SUPABASE ANON KEY (15 min)

**APENAS SE** `.env` estava tracked no git!

### Passos:

1. Acesse Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/yfxgncbopvnsltjqetxw/settings/api
   ```

2. Na seção "Project API keys":
   - Clique em "Reset anon key"
   - Copie a nova key

3. Atualize `.env`:
   ```bash
   VITE_SUPABASE_ANON_KEY=<NOVA_KEY_AQUI>
   ```

4. Reinicie o servidor:
   ```bash
   # Parar o servidor (Ctrl+C)
   npm run dev
   ```

**NOTA:** Isso vai deslogar todos os usuários ativos!

---

## 4️⃣ REMOVER TSCONFIG.APP.JSON (5 min)

### Comando:
```bash
# Remover arquivo conflitante
rm tsconfig.app.json

# Verificar
ls -la tsconfig*.json
# Deve mostrar apenas tsconfig.json e tsconfig.node.json
```

### Editar `tsconfig.json`:

**Garantir que strict está habilitado:**
```json
{
  "compilerOptions": {
    "strict": true,  // ✅ Manter true
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Testar:**
```bash
npm run type-check
```

---

## 5️⃣ CORRIGIR LOCALSTORAGE.CLEAR() (10 min)

### Arquivo: `src/contexts/AuthContext.tsx`

**Encontrar linha 201:**
```typescript
// ❌ ATUAL
localStorage.clear(); // Garante que lixo antigo não atrapalhe
```

**Substituir por:**
```typescript
// ✅ CORRIGIDO - Remover apenas chaves Supabase
Object.keys(localStorage)
  .filter(key => key.startsWith('sb-') || key.includes('supabase'))
  .forEach(key => localStorage.removeItem(key));
console.log('🧹 Storage Supabase limpo (preservando outros dados)');
```

**Testar:**
```bash
# Servidor já deve estar rodando
# Abra http://localhost:8080
# DevTools → Console
# Deve ver log "🧹 Storage Supabase limpo..."
```

---

## 6️⃣ COMMIT DAS CORREÇÕES (5 min)

```bash
cd "E:\Jurify\advo-ai-hub-main (1)\advo-ai-hub-main"

# Stage files
git add eslint.config.js tsconfig.json src/contexts/AuthContext.tsx

# Verificar mudanças
git diff --staged

# Commit
git commit -m "fix: Correções críticas de segurança e TypeScript

- Habilitar TypeScript strict rules (no-explicit-any: warn)
- Remover tsconfig.app.json conflitante
- Corrigir localStorage.clear() destrutivo
- Proteger dados de outras apps na mesma origem

BREAKING CHANGES:
- Desenvolvedores verão warnings de 'any' type
- Requer correção gradual de types

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 7️⃣ VALIDAR CORREÇÕES (10 min)

### Checklist de Validação:

```bash
# 1. Type-check passa
npm run type-check
# ✅ Deve passar (com warnings OK)

# 2. Lint mostra warnings (não errors)
npm run lint
# ✅ Deve mostrar warnings de 'any', não errors

# 3. Build funciona
npm run build
# ✅ Deve completar sem erros críticos

# 4. Servidor roda
npm run dev
# ✅ http://localhost:8080 deve carregar
```

### Se algum falhar:
- **Type-check falha:** Verificar tsconfig.json está correto
- **Lint falha:** Verificar eslint.config.js foi salvo
- **Build falha:** Ver logs e reportar erro
- **Servidor falha:** Verificar .env tem VITE_SUPABASE_URL e ANON_KEY

---

## ✅ RESULTADO ESPERADO

Após completar todos os 7 passos:

```diff
+ ✅ TypeScript strict rules habilitadas (warn)
+ ✅ .env protegido no .gitignore
+ ✅ tsconfig.app.json removido
+ ✅ localStorage.clear() corrigido
+ ✅ Commit criado com correções
+ ✅ Build e servidor funcionando
```

**Pontuação antes:** 5.2/10
**Pontuação depois:** 6.5/10 ⬆️ +1.3

---

## 🚨 PROBLEMAS COMUNS

### Erro: "npm run lint" falha completamente
**Solução:**
```bash
# Reinstalar ESLint
npm install -D eslint@latest
npm run lint
```

### Erro: "Module not found" após remover tsconfig.app.json
**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Erro: "Supabase connection failed" após rotacionar key
**Solução:**
```bash
# 1. Verificar .env tem a nova key
cat .env | grep VITE_SUPABASE_ANON_KEY

# 2. Reiniciar servidor
# Ctrl+C
npm run dev
```

### Muitos warnings de TypeScript após habilitar rules
**Esperado!** Isso é bom! Significa que problemas estão sendo detectados.

**Próximo passo:** Corrigir gradualmente (próxima semana)

---

## 📞 PRECISA DE AJUDA?

Se algum passo falhar:
1. Copie o erro completo
2. Verifique qual passo falhou
3. Consulte "PROBLEMAS COMUNS" acima
4. Me avise com o erro e o passo

---

**Tempo total:** ~2 horas
**Prioridade:** 🔴 FAZER ANTES DE CONTINUAR DESENVOLVIMENTO

**Próximo passo após concluir:** Seguir checklist "ESTA SEMANA" no `CODE_REVIEW_REPORT.md`
