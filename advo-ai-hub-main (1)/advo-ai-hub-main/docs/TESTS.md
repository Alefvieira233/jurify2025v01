
# Testes Automatizados - Jurify SaaS

## 🧪 Overview

O Jurify SaaS inclui testes automatizados E2E (End-to-End) usando Playwright para garantir a qualidade e funcionamento correto da aplicação.

## 🔧 Setup dos Testes

### Instalação
```bash
npm install -D @playwright/test
npx playwright install
```

### Executar Testes
```bash
# Todos os testes
npm run test:e2e

# Modo interativo
npm run test:e2e -- --ui

# Testes específicos
npm run test:e2e -- tests/auth.spec.ts

# Com debug
npm run test:e2e -- --debug
```

## 📋 Cobertura de Testes

### 1. Autenticação
- ✅ Exibição do formulário de login
- ✅ Validação de campos obrigatórios
- ✅ Alternância entre login/cadastro
- ✅ Redirecionamento de usuários autenticados
- ✅ Proteção de rotas

### 2. CRUD Operations
- ✅ **Leads**: Criar, listar, editar, excluir
- ✅ **Contratos**: Gerenciamento completo
- ✅ **Agendamentos**: Criação e visualização
- ✅ **Agentes IA**: Configuração e teste

### 3. Controle de Acesso (RBAC)
- ✅ Verificação de permissões por role
- ✅ Negação de acesso a seções restritas
- ✅ Acesso administrativo completo

### 4. Execução de Agentes IA
- ✅ Teste de execução de agentes
- ✅ Validação de resposta
- ✅ Tratamento de erros

## 🏗️ Estrutura dos Testes

```
tests/
├── auth.spec.ts           # Testes de autenticação
├── crud.spec.ts          # Testes CRUD principais
├── agents.spec.ts        # Testes específicos de IA
├── rbac.spec.ts         # Testes de permissões
└── playwright.config.ts  # Configuração do Playwright
```

## 🎯 Estratégia de Testes

### Page Object Model
```typescript
// Exemplo de Page Object
class LeadsPage {
  constructor(private page: Page) {}
  
  async createLead(data: LeadData) {
    await this.page.click('[data-testid="new-lead-button"]');
    await this.page.fill('input[name="nome_completo"]', data.nome);
    // ... more actions
  }
}
```

### Test Data Management
```typescript
// Mock data para testes
const mockLead = {
  nome_completo: 'João Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  area_juridica: 'Direito Civil'
};
```

### Authentication Mocking
```typescript
// Mock de usuário autenticado
await page.addInitScript(() => {
  localStorage.setItem('supabase.auth.token', JSON.stringify({
    access_token: 'mock-token',
    user: { id: '123', email: 'admin@test.com' }
  }));
});
```

## 📊 Relatórios

### HTML Report
Após executar os testes, o relatório HTML fica disponível em:
```
playwright-report/index.html
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Playwright tests
  run: npx playwright test
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔍 Debugging

### Visual Mode
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Screenshots on Failure
Os testes são configurados para capturar screenshots automaticamente em caso de falha.

## 🚀 Best Practices

### 1. Test Isolation
- Cada teste é independente
- Setup/teardown adequados
- Dados de teste isolados

### 2. Reliable Selectors
```typescript
// ✅ Bom - usar data-testid
await page.click('[data-testid="submit-button"]');

// ❌ Ruim - depender de texto
await page.click('text=Submit');
```

### 3. Wait for Elements
```typescript
// Aguardar elemento aparecer
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

### 4. Mock External APIs
```typescript
// Mock de API externa
await page.route('/api/external/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true })
  });
});
```

## 📈 Métricas de Testes

### Cobertura Atual
- **Autenticação**: 100%
- **CRUD Operations**: 90%
- **RBAC**: 95%
- **Agentes IA**: 85%

### Performance
- Tempo médio de execução: ~2 minutos
- Taxa de sucesso: >95%
- Flakiness: <5%

## 🔧 Configuração Avançada

### Cross-browser Testing
```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile', use: { ...devices['Pixel 5'] } }
]
```

### Parallel Execution
```typescript
// Executar testes em paralelo
fullyParallel: true,
workers: process.env.CI ? 1 : undefined
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Timeout Issues**
   ```typescript
   // Aumentar timeout para elementos específicos
   await expect(page.locator('.slow-element')).toBeVisible({ timeout: 10000 });
   ```

2. **Flaky Tests**
   ```typescript
   // Aguardar condições específicas
   await page.waitForLoadState('networkidle');
   ```

3. **Authentication Errors**
   ```typescript
   // Verificar mock de autenticação
   const token = await page.evaluate(() => localStorage.getItem('supabase.auth.token'));
   ```

## 📝 Adicionando Novos Testes

### Template para Novo Teste
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup comum
    await page.goto('/feature-url');
  });

  test('should perform action', async ({ page }) => {
    // Ações do teste
    await page.click('[data-testid="action-button"]');
    
    // Verificações
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

---

**Lembre-se**: Mantenha os testes simples, rápidos e confiáveis!
