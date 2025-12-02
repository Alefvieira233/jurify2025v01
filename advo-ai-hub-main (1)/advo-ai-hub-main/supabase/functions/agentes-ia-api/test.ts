// 🧪 TESTES CRÍTICOS PARA EDGE FUNCTION AGENTES-IA-API
// Testes de segurança, rate limiting, cache e RBAC

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const FUNCTION_URL = "http://localhost:54321/functions/v1/agentes-ia-api";

// Mock data para testes
const mockAgentId = "test-agent-123";
const mockMessage = "Olá, preciso de ajuda jurídica";

Deno.test("🔒 Security: Rate Limiting Test", async () => {
  const requests = [];
  
  // Fazer 105 requests rapidamente (acima do limite de 100)
  for (let i = 0; i < 105; i++) {
    requests.push(
      fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token"
        },
        body: JSON.stringify({
          agente_id: mockAgentId,
          message: `Test message ${i}`
        })
      })
    );
  }
  
  const responses = await Promise.all(requests);
  
  // Pelo menos algumas requests devem ser bloqueadas (429)
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  assertEquals(rateLimitedResponses.length > 0, true, "Rate limiting não está funcionando");
});

Deno.test("🛡️ Security: XSS Prevention Test", async () => {
  const maliciousPayloads = [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<iframe src='javascript:alert(1)'></iframe>",
    "onload=alert('xss')"
  ];
  
  for (const payload of maliciousPayloads) {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      },
      body: JSON.stringify({
        agente_id: mockAgentId,
        message: payload
      })
    });
    
    const result = await response.json();
    
    // Verificar se o payload malicioso foi sanitizado
    if (result.response) {
      assertEquals(
        result.response.includes("<script>"), 
        false, 
        `XSS payload não foi sanitizado: ${payload}`
      );
    }
  }
});

Deno.test("⚡ Performance: Cache Functionality Test", async () => {
  // Primeira request (deve buscar no DB)
  const start1 = Date.now();
  const response1 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({
      agente_id: mockAgentId,
      message: mockMessage
    })
  });
  const time1 = Date.now() - start1;
  
  // Segunda request (deve usar cache)
  const start2 = Date.now();
  const response2 = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({
      agente_id: mockAgentId,
      message: mockMessage
    })
  });
  const time2 = Date.now() - start2;
  
  // Cache deve ser mais rápido
  assertEquals(time2 < time1, true, "Cache não está melhorando performance");
  assertEquals(response1.status, 200);
  assertEquals(response2.status, 200);
});

Deno.test("🔐 Security: Authentication Test", async () => {
  // Request sem token
  const responseNoAuth = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      agente_id: mockAgentId,
      message: mockMessage
    })
  });
  
  assertEquals(responseNoAuth.status, 401, "Endpoint deve rejeitar requests sem autenticação");
  
  // Request com token inválido
  const responseInvalidAuth = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token"
    },
    body: JSON.stringify({
      agente_id: mockAgentId,
      message: mockMessage
    })
  });
  
  assertEquals(responseInvalidAuth.status, 401, "Endpoint deve rejeitar tokens inválidos");
});

Deno.test("📊 Validation: Input Validation Test", async () => {
  const invalidPayloads = [
    {}, // Payload vazio
    { agente_id: "" }, // ID vazio
    { agente_id: "a".repeat(1000) }, // ID muito longo
    { agente_id: mockAgentId, message: "" }, // Mensagem vazia
    { agente_id: mockAgentId, message: "a".repeat(10000) }, // Mensagem muito longa
    { agente_id: null, message: mockMessage }, // ID null
    { agente_id: mockAgentId, message: null }, // Mensagem null
  ];
  
  for (const payload of invalidPayloads) {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
      },
      body: JSON.stringify(payload)
    });
    
    assertEquals(
      response.status >= 400 && response.status < 500,
      true,
      `Payload inválido deve retornar erro 4xx: ${JSON.stringify(payload)}`
    );
  }
});

Deno.test("🚀 Performance: Response Time Test", async () => {
  const start = Date.now();
  
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({
      agente_id: mockAgentId,
      message: mockMessage
    })
  });
  
  const responseTime = Date.now() - start;
  
  // Response deve ser menor que 5 segundos
  assertEquals(responseTime < 5000, true, `Response time muito alto: ${responseTime}ms`);
  assertEquals(response.status, 200);
});

Deno.test("🔄 Reliability: Error Handling Test", async () => {
  // Test com agente inexistente
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({
      agente_id: "nonexistent-agent-id",
      message: mockMessage
    })
  });
  
  assertEquals(response.status, 404, "Deve retornar 404 para agente inexistente");
  
  const result = await response.json();
  assertExists(result.error, "Deve retornar mensagem de erro");
});

// Teste de load/stress básico
Deno.test("⚡ Load: Concurrent Requests Test", async () => {
  const concurrentRequests = 10;
  const requests = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    requests.push(
      fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token"
        },
        body: JSON.stringify({
          agente_id: mockAgentId,
          message: `Concurrent message ${i}`
        })
      })
    );
  }
  
  const responses = await Promise.all(requests);
  
  // Todas as requests devem ser processadas com sucesso (ou rate limited)
  const successfulResponses = responses.filter(r => r.status === 200 || r.status === 429);
  assertEquals(
    successfulResponses.length, 
    concurrentRequests, 
    "Nem todas as requests concorrentes foram processadas corretamente"
  );
});
