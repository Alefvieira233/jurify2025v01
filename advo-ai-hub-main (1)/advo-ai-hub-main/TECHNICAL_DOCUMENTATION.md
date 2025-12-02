# 🚀 TECHNICAL DOCUMENTATION
## Advo AI Hub - Production Architecture Guide

### 📋 System Overview

The Advo AI Hub is a comprehensive legal SaaS platform built with modern technologies and enterprise-grade architecture patterns. This document provides detailed technical specifications for developers and system administrators.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with RBAC
- **Cache**: Redis (production) / Memory (development)
- **Monitoring**: Sentry + Custom Analytics
- **AI Integration**: OpenAI GPT-4 + Custom Agents

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│  Supabase API   │────│   PostgreSQL    │
│   (Frontend)    │    │  (Edge Funcs)   │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Redis Cache    │──────────────┘
                        │  (Performance)  │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Monitoring    │
                        │ (Sentry + APM)  │
                        └─────────────────┘
```

## 🗄️ Database Schema

### Core Tables
```sql
-- Users and Authentication
profiles (id, email, nome, role, tenant_id, created_at, updated_at)
user_permissions (user_id, resource, action, tenant_id)

-- Business Entities
leads (id, nome, email, telefone, area_juridica, status, tenant_id)
contratos (id, titulo, valor, cliente_id, status, tenant_id)
processos (id, numero, cliente_id, status, tribunal, tenant_id)
agentes_ia (id, nome, tipo, configuracao, ativo, tenant_id)

-- System Tables
audit_logs (id, user_id, action, table_name, record_id, changes)
system_metrics (id, metric_name, value, timestamp, tenant_id)
```

### Indexes and Performance
```sql
-- Critical indexes for performance
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_contratos_tenant_cliente ON contratos(tenant_id, cliente_id);
CREATE INDEX idx_processos_tenant_numero ON processos(tenant_id, numero);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, created_at);

-- Materialized views for dashboard
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
  tenant_id,
  COUNT(*) FILTER (WHERE status = 'ativo') as leads_ativos,
  COUNT(*) FILTER (WHERE status = 'convertido') as leads_convertidos,
  AVG(valor) as valor_medio_contratos
FROM leads l
LEFT JOIN contratos c ON l.id = c.cliente_id
GROUP BY tenant_id;
```

## 🔧 Component Architecture

### Frontend Structure
```
src/
├── components/           # Reusable UI components
│   ├── AgentesIA/       # AI Agents management
│   ├── Leads/           # Lead management
│   ├── Contratos/       # Contract management
│   └── shared/          # Shared components
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication & RBAC
│   └── ThemeContext.tsx # UI theming
├── hooks/               # Custom React hooks
│   ├── useOptimizedQuery.ts
│   └── usePermissions.ts
├── utils/               # Utility functions
│   ├── validation.ts    # Input validation
│   ├── encryption.ts    # Data encryption
│   ├── cacheService.ts  # Caching layer
│   └── monitoring.ts    # Analytics & monitoring
└── __tests__/           # Test suites
    ├── security.test.ts
    └── components.test.ts
```

### Component Design Patterns

#### 1. Modular Components
```typescript
// Before: Monolithic component (630 lines)
const AgentesIAManager = () => {
  // All logic mixed together
};

// After: Modular architecture
const AgentesIAManager = () => {
  const filters = useAgentesIAFilters();
  return (
    <div>
      <AgentesIAFilters {...filters} />
      <AgentesIAList agents={filteredAgents} />
    </div>
  );
};
```

#### 2. Custom Hooks Pattern
```typescript
// Reusable business logic
export const useAgentesIAFilters = () => {
  const [filters, setFilters] = useState(initialFilters);
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const filteredAgents = useMemo(() => 
    applyFilters(agents, { ...filters, search: debouncedSearch }),
    [agents, filters, debouncedSearch]
  );
  
  return { filters, setFilters, filteredAgents };
};
```

#### 3. Performance Optimization
```typescript
// Optimized queries with cache
export const useOptimizedQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: QueryOptions
) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      // Try cache first
      const cached = await cacheService.get(queryKey);
      if (cached) return cached;
      
      // Fetch and cache
      const data = await queryFn();
      await cacheService.set(queryKey, data, options?.ttl);
      return data;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    retry: options?.retry || 3
  });
};
```

## 🔐 Security Implementation

### RBAC System
```typescript
// Permission-based access control
interface Permission {
  resource: string;  // 'leads', 'contratos', 'processos'
  action: string;    // 'create', 'read', 'update', 'delete'
  tenant_id: string; // Multi-tenant isolation
}

// Usage in components
const { hasPermission } = useAuth();

const handleDelete = async () => {
  if (!await hasPermission('leads', 'delete')) {
    toast.error('Permissão negada');
    return;
  }
  // Proceed with deletion
};
```

### Data Encryption
```typescript
// Encrypt sensitive data before storage
const encryptedLead = encryption.encryptPII({
  nome: 'João Silva',
  cpf: '11144477735',
  telefone: '11999887766'
});

// Decrypt for display
const decryptedLead = encryption.decryptPII(encryptedLead);
```

### Input Validation
```typescript
// Comprehensive validation
const validateLeadData = (data: LeadInput) => {
  const errors: string[] = [];
  
  if (!validateEmail(data.email).isValid) {
    errors.push('Email inválido');
  }
  
  if (!validateCPF(data.cpf).isValid) {
    errors.push('CPF inválido');
  }
  
  const sanitizedData = {
    ...data,
    nome: validation.sanitizeText(data.nome),
    descricao: validation.sanitizeText(data.descricao)
  };
  
  return { isValid: errors.length === 0, errors, sanitizedData };
};
```

## 📊 Performance Optimization

### Caching Strategy
```typescript
// Multi-layer caching
class CacheService {
  private memoryCache = new Map();
  private redisClient?: Redis;
  
  async get(key: string): Promise<any> {
    // L1: Memory cache (fastest)
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // L2: Redis cache (fast)
    if (this.redisClient) {
      const cached = await this.redisClient.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        this.memoryCache.set(key, data); // Populate L1
        return data;
      }
    }
    
    return null;
  }
}
```

### Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Automatic refresh for materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_metrics_trigger
AFTER INSERT OR UPDATE OR DELETE ON leads
FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_metrics();
```

### Frontend Performance
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedLeadsList = ({ leads }: { leads: Lead[] }) => (
  <List
    height={600}
    itemCount={leads.length}
    itemSize={120}
    itemData={leads}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <LeadCard lead={data[index]} />
      </div>
    )}
  </List>
);
```

## 🔍 Monitoring & Observability

### Custom Analytics
```typescript
// Business metrics tracking
export const trackUserAction = (action: string, metadata?: any) => {
  monitoring.track('user_action', {
    action,
    user_id: getCurrentUser()?.id,
    tenant_id: getCurrentTenant()?.id,
    timestamp: new Date().toISOString(),
    metadata
  });
};

// Performance monitoring
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    monitoring.track('performance', {
      operation,
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    monitoring.track('performance', {
      operation,
      duration: performance.now() - start,
      success: false,
      error: error.message
    });
    throw error;
  }
};
```

### Health Checks
```typescript
// System health monitoring
export const healthCheck = async (): Promise<HealthStatus> => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkCache(),
    checkExternalAPIs(),
    checkDiskSpace(),
    checkMemoryUsage()
  ]);
  
  return {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks: checks.map((check, index) => ({
      name: ['database', 'cache', 'apis', 'disk', 'memory'][index],
      status: check.status,
      details: check.status === 'fulfilled' ? check.value : check.reason
    })),
    timestamp: new Date().toISOString()
  };
};
```

## 🧪 Testing Strategy

### Test Pyramid
```
    ┌─────────────────┐
    │   E2E Tests     │ ← Few, critical user journeys
    │   (Cypress)     │
    ├─────────────────┤
    │ Integration     │ ← API + Database interactions
    │ Tests (Jest)    │
    ├─────────────────┤
    │  Unit Tests     │ ← Many, fast, isolated
    │  (Jest + RTL)   │
    └─────────────────┘
```

### Security Testing
```typescript
// Automated security tests
describe('Security Tests', () => {
  it('should prevent unauthorized access', async () => {
    const response = await request(app)
      .delete('/api/leads/123')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
  
  it('should prevent SQL injection', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = validation.sanitizeSQL(maliciousInput);
    expect(sanitized).not.toContain('DROP');
  });
});
```

## 🚀 Deployment

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
ENCRYPTION_SECRET=your-256-bit-secret
REDIS_URL=redis://your-redis-instance
SENTRY_DSN=https://your-sentry-dsn
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm ci
          npm run test:unit
          npm run test:integration
          npm run test:security
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          npm run build
          npm run deploy:production
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Database**: Read replicas for query distribution
- **Cache**: Redis cluster for high availability
- **CDN**: Static asset distribution
- **Load Balancer**: Traffic distribution across instances

### Performance Targets
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms (95th percentile)
- **Database Query Time**: < 100ms (average)
- **Cache Hit Rate**: > 90%

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: March 2025

> 📝 **Note**: This documentation should be updated whenever significant architectural changes are made to the system.
