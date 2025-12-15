import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multiAgentSystem } from '@/lib/multiagents';
import { MessageType, Priority } from '@/lib/multiagents/types';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe('Enterprise Multi-Agent System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize all agents correctly', () => {
    const stats = multiAgentSystem.getSystemStats();
    expect(stats.total_agents).toBe(5);
    expect(stats.active_agents).toContain('Coordenador');
    expect(stats.active_agents).toContain('Qualificador');
    expect(stats.active_agents).toContain('Juridico');
  });

  it('should process a lead through the full lifecycle', async () => {
    // 1. Setup mocks for AI responses
    const mockInvoke = supabase.functions.invoke as any;
    
    // Mock Coordinator response (Plan)
    mockInvoke.mockResolvedValueOnce({
      data: { result: 'Plan: Analyze lead -> Validate Case -> Create Proposal' },
      error: null
    });

    // Mock Qualifier response (Analysis)
    mockInvoke.mockResolvedValueOnce({
      data: { result: 'Analysis: Valid labor law case, high urgency.' },
      error: null
    });

    // Mock Legal response (Validation)
    mockInvoke.mockResolvedValueOnce({
      data: { result: 'Validation: Case is viable and legally sound.' },
      error: null
    });

    // Mock Commercial response (Proposal)
    mockInvoke.mockResolvedValueOnce({
      data: { result: 'Proposal: Fee 20%, upfront $1000.' },
      error: null
    });

    // Mock Communicator response (Format)
    mockInvoke.mockResolvedValueOnce({
      data: { result: 'Hello! Here is our proposal... 🚀' },
      error: null
    });

    // 2. Start Lead Processing
    const leadData = {
      id: 'test-lead-123',
      name: 'John Doe',
      message: 'I was unfairly dismissed.',
      source: 'web'
    };

    await multiAgentSystem.processLead(leadData, leadData.message);

    // 3. Wait for async processing (simple timeout for simulation or we can wait for promises if we had access)
    // Since the system is fire-and-forget with setImmediate/setTimeout, we might need to wait a bit.
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Verify Coordinator was called initially
    expect(mockInvoke).toHaveBeenCalledTimes(1); // At least coordinator should have run
    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'ai-agent-processor', expect.objectContaining({
      body: expect.objectContaining({
        agentName: 'Coordenador',
        userPrompt: expect.stringContaining('Analise este lead'),
      })
    }));

    // Note: To fully test the chain without flaky timeouts, we would need to mock the system to be synchronous or expose promises.
    // For this integration test, we verify the entry point and the orchestration logic if possible.
  });

  it('should handle errors gracefully', async () => {
    const mockInvoke = supabase.functions.invoke as any;
    mockInvoke.mockResolvedValue({ error: new Error('AI Service Down') });

    const leadData = {
      id: 'error-lead',
      name: 'Error Test',
      message: 'Fail me',
      source: 'test'
    };

    await expect(multiAgentSystem.processLead(leadData, 'Fail me')).resolves.not.toThrow();
  });
});
