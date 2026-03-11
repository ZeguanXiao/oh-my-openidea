import { describe, expect, mock, test } from 'bun:test';
import { BackgroundTaskManager } from './background-manager';

// Mock the plugin context
function createMockContext(overrides?: {
  sessionCreateResult?: { data?: { id?: string } };
  sessionStatusResult?: { data?: Record<string, { type: string }> };
  sessionMessagesResult?: {
    data?: Array<{
      info?: { role: string };
      parts?: Array<{ type: string; text?: string }>;
    }>;
  };
  promptImpl?: (args: any) => Promise<unknown>;
}) {
  let callCount = 0;
  return {
    client: {
      session: {
        create: mock(async () => {
          callCount++;
          return (
            overrides?.sessionCreateResult ?? {
              data: { id: `test-session-${callCount}` },
            }
          );
        }),
        status: mock(
          async () => overrides?.sessionStatusResult ?? { data: {} },
        ),
        messages: mock(
          async () => overrides?.sessionMessagesResult ?? { data: [] },
        ),
        prompt: mock(async (args: any) => {
          if (overrides?.promptImpl) {
            return await overrides.promptImpl(args);
          }
          return {};
        }),
        abort: mock(async () => ({})),
      },
    },
    directory: '/test/directory',
  } as any;
}

describe('BackgroundTaskManager', () => {
  describe('constructor', () => {
    test('creates manager with defaults', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);
      expect(manager).toBeDefined();
    });

    test('creates manager with tmux config', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx, {
        enabled: true,
        layout: 'main-vertical',
        main_pane_size: 60,
      });
      expect(manager).toBeDefined();
    });

    test('creates manager with background config', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx, undefined, {
        background: {
          maxConcurrentStarts: 5,
        },
      });
      expect(manager).toBeDefined();
    });
  });

  describe('launch (fire-and-forget)', () => {
    test('returns task immediately with pending or starting status', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'Find all test files',
        description: 'Test file search',
        parentSessionId: 'parent-123',
      });

      expect(task.id).toMatch(/^bg_/);
      // Task may be pending (in queue) or starting (already started)
      expect(['pending', 'starting']).toContain(task.status);
      expect(task.sessionId).toBeUndefined();
      expect(task.agent).toBe('explorer');
      expect(task.description).toBe('Test file search');
      expect(task.startedAt).toBeDefined();
    });

    test('sessionId is set asynchronously when task starts', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Immediately after launch, no sessionId
      expect(task.sessionId).toBeUndefined();

      // Wait for microtask queue to process
      await Promise.resolve();
      await Promise.resolve();

      // After background start, sessionId should be set
      expect(task.sessionId).toBeDefined();
      expect(task.status).toBe('running');
    });

    test('task fails when session creation fails', async () => {
      const ctx = createMockContext({ sessionCreateResult: { data: {} } });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      await Promise.resolve();
      await Promise.resolve();

      expect(task.status).toBe('failed');
      expect(task.error).toBe('Failed to create background session');
    });

    test('multiple launches return immediately', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task1 = manager.launch({
        agent: 'explorer',
        prompt: 'test1',
        description: 'test1',
        parentSessionId: 'parent-123',
      });

      const task2 = manager.launch({
        agent: 'oracle',
        prompt: 'test2',
        description: 'test2',
        parentSessionId: 'parent-123',
      });

      const task3 = manager.launch({
        agent: 'fixer',
        prompt: 'test3',
        description: 'test3',
        parentSessionId: 'parent-123',
      });

      // All return immediately with pending or starting status
      expect(['pending', 'starting']).toContain(task1.status);
      expect(['pending', 'starting']).toContain(task2.status);
      expect(['pending', 'starting']).toContain(task3.status);
    });
  });

  describe('handleSessionStatus', () => {
    test('completes task when session becomes idle', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'Result text' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      // Simulate session.idle event
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      expect(task.status).toBe('completed');
      expect(task.result).toBe('Result text');
    });

    test('ignores non-idle status', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Simulate session.busy event
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'busy' },
        },
      });

      expect(task.status).toBe('running');
    });

    test('ignores non-matching session ID', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Simulate event for different session
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: 'other-session-id',
          status: { type: 'idle' },
        },
      });

      expect(task.status).toBe('running');
    });
  });

  describe('getResult', () => {
    test('returns null for unknown task', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const result = manager.getResult('unknown-task-id');
      expect(result).toBeNull();
    });

    test('returns task immediately (no blocking)', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      const result = manager.getResult(task.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(task.id);
    });
  });

  describe('waitForCompletion', () => {
    test('waits for task to complete', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'Done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      // Trigger completion via session.status event
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      // Now waitForCompletion should return immediately
      const result = await manager.waitForCompletion(task.id, 5000);
      expect(result?.status).toBe('completed');
      expect(result?.result).toBe('Done');
    });

    test('returns immediately if already completed', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'Done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      // Trigger completion
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      // Now wait should return immediately
      const result = await manager.waitForCompletion(task.id, 5000);
      expect(result?.status).toBe('completed');
    });

    test('returns null for unknown task', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const result = await manager.waitForCompletion('unknown-task-id', 5000);
      expect(result).toBeNull();
    });
  });

  describe('cancel', () => {
    test('cancels pending task before it starts', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      const count = manager.cancel(task.id);
      expect(count).toBe(1);

      const result = manager.getResult(task.id);
      expect(result?.status).toBe('cancelled');
    });

    test('cancels running task', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      const count = manager.cancel(task.id);
      expect(count).toBe(1);

      const result = manager.getResult(task.id);
      expect(result?.status).toBe('cancelled');
    });

    test('returns 0 when cancelling unknown task', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const count = manager.cancel('unknown-task-id');
      expect(count).toBe(0);
    });

    test('cancels all pending/running tasks when no ID provided', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      manager.launch({
        agent: 'explorer',
        prompt: 'test1',
        description: 'test1',
        parentSessionId: 'parent-123',
      });

      manager.launch({
        agent: 'oracle',
        prompt: 'test2',
        description: 'test2',
        parentSessionId: 'parent-123',
      });

      const count = manager.cancel();
      expect(count).toBe(2);
    });

    test('does not cancel already completed tasks', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'Done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      // Trigger completion
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      // Now try to cancel - should fail since already completed
      const count = manager.cancel(task.id);
      expect(count).toBe(0);
    });
  });

  describe('BackgroundTask logic', () => {
    test('falls back to next model when first model prompt fails', async () => {
      let promptCalls = 0;
      const ctx = createMockContext({
        promptImpl: async (args) => {
          const isTaskPrompt =
            typeof args.path?.id === 'string' &&
            args.path.id.startsWith('test-session-');
          const isParentNotification = !isTaskPrompt;
          if (isParentNotification) return {};

          promptCalls += 1;
          const modelRef = args.body?.model;
          if (
            modelRef?.providerID === 'openai' &&
            modelRef?.modelID === 'gpt-5.2-codex'
          ) {
            throw new Error('primary failed');
          }
          return {};
        },
      });

      const manager = new BackgroundTaskManager(ctx, undefined, {
        fallback: {
          enabled: true,
          timeoutMs: 15000,
          chains: {
            explorer: ['openai/gpt-5.2-codex', 'opencode/gpt-5-nano'],
          },
        },
      });

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      await Promise.resolve();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 10));

      expect(task.status).toBe('running');
      expect(promptCalls).toBe(2);
    });

    test('fails task when all fallback models fail', async () => {
      const ctx = createMockContext({
        promptImpl: async (args) => {
          const isTaskPrompt =
            typeof args.path?.id === 'string' &&
            args.path.id.startsWith('test-session-');
          const isParentNotification = !isTaskPrompt;
          if (isParentNotification) return {};
          throw new Error('all models failing');
        },
      });

      const manager = new BackgroundTaskManager(ctx, undefined, {
        fallback: {
          enabled: true,
          timeoutMs: 15000,
          chains: {
            explorer: ['openai/gpt-5.2-codex', 'opencode/gpt-5-nano'],
          },
        },
      });

      const task = manager.launch({
        agent: 'explorer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'parent-123',
      });

      await Promise.resolve();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 10));

      expect(task.status).toBe('failed');
      expect(task.error).toContain('All fallback models failed');
    });

    test('extracts content from multiple types and messages', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [
                { type: 'reasoning', text: 'I am thinking...' },
                { type: 'text', text: 'First part.' },
              ],
            },
            {
              info: { role: 'assistant' },
              parts: [
                { type: 'text', text: 'Second part.' },
                { type: 'text', text: '' }, // Should be ignored
              ],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      const task = manager.launch({
        agent: 'test',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'p1',
      });

      // Wait for task to start
      await Promise.resolve();
      await Promise.resolve();

      // Trigger completion
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      expect(task.status).toBe('completed');
      expect(task.result).toContain('I am thinking...');
      expect(task.result).toContain('First part.');
      expect(task.result).toContain('Second part.');
      // Check for double newline join
      expect(task.result).toBe(
        'I am thinking...\n\nFirst part.\n\nSecond part.',
      );
    });

    test('task has completedAt timestamp on completion or cancellation', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      // Test completion timestamp
      const task1 = manager.launch({
        agent: 'test',
        prompt: 't1',
        description: 'd1',
        parentSessionId: 'p1',
      });

      await Promise.resolve();
      await Promise.resolve();

      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task1.sessionId,
          status: { type: 'idle' },
        },
      });

      expect(task1.completedAt).toBeInstanceOf(Date);
      expect(task1.status).toBe('completed');

      // Test cancellation timestamp
      const task2 = manager.launch({
        agent: 'test',
        prompt: 't2',
        description: 'd2',
        parentSessionId: 'p2',
      });

      manager.cancel(task2.id);
      expect(task2.completedAt).toBeInstanceOf(Date);
      expect(task2.status).toBe('cancelled');
    });

    test('always sends notification to parent session on completion', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx, undefined, {
        background: { maxConcurrentStarts: 10 },
      });

      const task = manager.launch({
        agent: 'test',
        prompt: 't',
        description: 'd',
        parentSessionId: 'parent-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: task.sessionId,
          status: { type: 'idle' },
        },
      });

      // Should have called prompt.append for notification
      expect(ctx.client.session.prompt).toHaveBeenCalled();
    });
  });

  describe('subagent delegation restrictions', () => {
    test('spawned surveyor gets tools disabled (leaf node)', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // First, simulate orchestrator starting (parent session with no parent)
      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Verify orchestrator's session is tracked
      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      // Launch surveyor from orchestrator - surveyor is a leaf node so tools disabled
      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: orchestratorSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      // Surveyor cannot delegate, so delegation tools are hidden
      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('spawned architect gets tools disabled (leaf node)', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // First, launch an orchestrator task
      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Launch architect from orchestrator - architect is a leaf node, so tools are disabled
      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      manager.launch({
        agent: 'architect',
        prompt: 'test',
        description: 'test',
        parentSessionId: orchestratorSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      // Architect is a leaf node, so delegation tools are hidden
      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('spawned surveyor from architect gets tools disabled (leaf node)', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch an architect task
      const architectTask = manager.launch({
        agent: 'architect',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Launch surveyor from architect - surveyor is a leaf node so tools disabled
      const architectSessionId = architectTask.sessionId;
      if (!architectSessionId)
        throw new Error('Expected sessionId to be defined');

      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: architectSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('writer cannot delegate to any subagents', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch a writer task
      const writerTask = manager.launch({
        agent: 'writer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Launch subagent from writer - should have tools disabled
      const writerSessionId = writerTask.sessionId;
      if (!writerSessionId) throw new Error('Expected sessionId to be defined');

      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: writerSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('critic cannot delegate to any subagents except surveyor', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch a critic task
      const criticTask = manager.launch({
        agent: 'critic',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      // Launch subagent from critic - should have tools disabled
      const criticSessionId = criticTask.sessionId;
      if (!criticSessionId) throw new Error('Expected sessionId to be defined');

      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: criticSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('spawned surveyor from unknown parent gets tools disabled (leaf node)', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch surveyor from unknown parent session (root orchestrator)
      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'unknown-session-id',
      });

      await Promise.resolve();
      await Promise.resolve();

      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      // Surveyor is a leaf agent — tools disabled regardless of parent
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('isAgentAllowed returns true for valid delegations', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      // Orchestrator can delegate to all subagents
      expect(manager.isAgentAllowed(orchestratorSessionId, 'surveyor')).toBe(
        true,
      );
      expect(manager.isAgentAllowed(orchestratorSessionId, 'writer')).toBe(
        true,
      );
      expect(manager.isAgentAllowed(orchestratorSessionId, 'architect')).toBe(
        true,
      );
      expect(manager.isAgentAllowed(orchestratorSessionId, 'synthesizer')).toBe(
        true,
      );
      expect(manager.isAgentAllowed(orchestratorSessionId, 'critic')).toBe(
        true,
      );
    });

    test('isAgentAllowed returns false for invalid delegations', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      const writerTask = manager.launch({
        agent: 'writer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const writerSessionId = writerTask.sessionId;
      if (!writerSessionId) throw new Error('Expected sessionId to be defined');

      // Writer cannot delegate to any subagents
      expect(manager.isAgentAllowed(writerSessionId, 'surveyor')).toBe(false);
      expect(manager.isAgentAllowed(writerSessionId, 'critic')).toBe(false);
      expect(manager.isAgentAllowed(writerSessionId, 'architect')).toBe(false);
    });

    test('isAgentAllowed returns false for leaf agents', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Surveyor is a leaf agent
      const surveyorTask = manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const surveyorSessionId = surveyorTask.sessionId;
      if (!surveyorSessionId)
        throw new Error('Expected sessionId to be defined');

      expect(manager.isAgentAllowed(surveyorSessionId, 'writer')).toBe(false);

      // Writer is also a leaf agent
      const writerTask2 = manager.launch({
        agent: 'writer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const writerSessionId2 = writerTask2.sessionId;
      if (!writerSessionId2)
        throw new Error('Expected sessionId to be defined');

      expect(manager.isAgentAllowed(writerSessionId2, 'surveyor')).toBe(false);
    });

    test('isAgentAllowed treats unknown session as root orchestrator', () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Unknown sessions default to orchestrator, which can delegate to all subagents
      expect(manager.isAgentAllowed('unknown-session', 'surveyor')).toBe(true);
      expect(manager.isAgentAllowed('unknown-session', 'writer')).toBe(true);
      expect(manager.isAgentAllowed('unknown-session', 'architect')).toBe(true);
      expect(manager.isAgentAllowed('unknown-session', 'synthesizer')).toBe(
        true,
      );
      expect(manager.isAgentAllowed('unknown-session', 'critic')).toBe(true);
    });

    test('unknown agent type defaults to surveyor-only delegation', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch a task with an agent type not in SUBAGENT_DELEGATION_RULES
      const customTask = manager.launch({
        agent: 'custom-agent',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const customSessionId = customTask.sessionId;
      if (!customSessionId) throw new Error('Expected sessionId to be defined');

      // Unknown agent types should default to surveyor-only
      expect(manager.getAllowedSubagents(customSessionId)).toEqual([
        'surveyor',
      ]);
      expect(manager.isAgentAllowed(customSessionId, 'surveyor')).toBe(true);
      expect(manager.isAgentAllowed(customSessionId, 'writer')).toBe(false);
      expect(manager.isAgentAllowed(customSessionId, 'critic')).toBe(false);
    });

    test('spawned surveyor from custom agent gets tools disabled (leaf node)', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Launch a custom agent first to get a tracked session
      const parentTask = manager.launch({
        agent: 'custom-agent',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const parentSessionId = parentTask.sessionId;
      if (!parentSessionId) throw new Error('Expected sessionId to be defined');

      // Launch surveyor from custom agent - surveyor is leaf, tools disabled
      manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: parentSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      // Surveyor is a leaf agent — tools disabled regardless of parent
      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const lastCall = promptCalls[promptCalls.length - 1];
      expect(lastCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });
    });

    test('full chain: orchestrator → synthesizer → surveyor', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Level 1: Launch orchestrator
      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'coordinate work',
        description: 'orchestrator',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      // Level 2: Launch synthesizer from orchestrator
      const synthesizerTask = manager.launch({
        agent: 'synthesizer',
        prompt: 'synthesize ideas',
        description: 'synthesizer',
        parentSessionId: orchestratorSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const synthesizerSessionId = synthesizerTask.sessionId;
      if (!synthesizerSessionId)
        throw new Error('Expected sessionId to be defined');

      // Synthesizer can only delegate to surveyor
      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const synthesizerPromptCall = promptCalls[1];
      expect(synthesizerPromptCall[0].body.tools).toEqual({
        background_task: true,
        task: true,
      });

      // Synthesizer can spawn surveyor but not others
      expect(manager.isAgentAllowed(synthesizerSessionId, 'surveyor')).toBe(
        true,
      );
      expect(manager.isAgentAllowed(synthesizerSessionId, 'architect')).toBe(
        false,
      );
      expect(manager.isAgentAllowed(synthesizerSessionId, 'critic')).toBe(
        false,
      );

      // Level 3: Launch surveyor from synthesizer
      const surveyorTask2 = manager.launch({
        agent: 'surveyor',
        prompt: 'find patterns',
        description: 'surveyor',
        parentSessionId: synthesizerSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const surveyorSessionId2 = surveyorTask2.sessionId;
      if (!surveyorSessionId2)
        throw new Error('Expected sessionId to be defined');

      // Surveyor gets tools DISABLED
      const surveyorPromptCall = promptCalls[2];
      expect(surveyorPromptCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });

      // Surveyor is a dead end
      expect(manager.getAllowedSubagents(surveyorSessionId2)).toEqual([]);
    });

    test('chain enforcement: writer cannot spawn unauthorized agents mid-chain', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Orchestrator spawns writer
      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      const writerTask3 = manager.launch({
        agent: 'writer',
        prompt: 'test',
        description: 'test',
        parentSessionId: orchestratorSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const writerSessionId3 = writerTask3.sessionId;
      if (!writerSessionId3)
        throw new Error('Expected sessionId to be defined');

      // Writer should be blocked from spawning these agents
      expect(manager.isAgentAllowed(writerSessionId3, 'critic')).toBe(false);
      expect(manager.isAgentAllowed(writerSessionId3, 'architect')).toBe(false);
      expect(manager.isAgentAllowed(writerSessionId3, 'synthesizer')).toBe(
        false,
      );
      expect(manager.isAgentAllowed(writerSessionId3, 'writer')).toBe(false);

      // Surveyor is also blocked (writer is a leaf node)
      expect(manager.isAgentAllowed(writerSessionId3, 'surveyor')).toBe(false);
      expect(manager.getAllowedSubagents(writerSessionId3)).toEqual([]);
    });

    test('chain: completed parent does not affect child permissions', async () => {
      const ctx = createMockContext({
        sessionMessagesResult: {
          data: [
            {
              info: { role: 'assistant' },
              parts: [{ type: 'text', text: 'done' }],
            },
          ],
        },
      });
      const manager = new BackgroundTaskManager(ctx);

      // Launch architect
      const architectTask = manager.launch({
        agent: 'architect',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const architectSessionId = architectTask.sessionId;
      if (!architectSessionId)
        throw new Error('Expected sessionId to be defined');

      // Launch surveyor from architect BEFORE architect completes
      const surveyorTask3 = manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: architectSessionId,
      });

      await Promise.resolve();
      await Promise.resolve();

      const surveyorSessionId3 = surveyorTask3.sessionId;
      if (!surveyorSessionId3)
        throw new Error('Expected sessionId to be defined');

      // Surveyor has its own tracking — tools disabled
      const promptCalls = ctx.client.session.prompt.mock.calls as Array<
        [{ body: { tools?: Record<string, boolean> } }]
      >;
      const surveyorPromptCall = promptCalls[1];
      expect(surveyorPromptCall[0].body.tools).toEqual({
        background_task: false,
        task: false,
      });

      // Now complete the architect (cleans up architect's agentBySessionId entry)
      await manager.handleSessionStatus({
        type: 'session.status',
        properties: {
          sessionID: architectSessionId,
          status: { type: 'idle' },
        },
      });

      expect(architectTask.status).toBe('completed');

      // Surveyor's own session tracking is independent — still works
      expect(manager.isAgentAllowed(surveyorSessionId3, 'writer')).toBe(false);
      expect(manager.getAllowedSubagents(surveyorSessionId3)).toEqual([]);
    });

    test('getAllowedSubagents returns correct lists', async () => {
      const ctx = createMockContext();
      const manager = new BackgroundTaskManager(ctx);

      // Orchestrator -> all 5 subagent names
      const orchestratorTask = manager.launch({
        agent: 'orchestrator',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const orchestratorSessionId = orchestratorTask.sessionId;
      if (!orchestratorSessionId)
        throw new Error('Expected sessionId to be defined');

      expect(manager.getAllowedSubagents(orchestratorSessionId)).toEqual([
        'surveyor',
        'synthesizer',
        'critic',
        'architect',
        'writer',
      ]);

      // Writer -> empty (leaf node)
      const writerTask4 = manager.launch({
        agent: 'writer',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const writerSessionId4 = writerTask4.sessionId;
      if (!writerSessionId4)
        throw new Error('Expected sessionId to be defined');

      expect(manager.getAllowedSubagents(writerSessionId4)).toEqual([]);

      // Architect -> empty (leaf node)
      const architectTask2 = manager.launch({
        agent: 'architect',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const architectSessionId2 = architectTask2.sessionId;
      if (!architectSessionId2)
        throw new Error('Expected sessionId to be defined');

      expect(manager.getAllowedSubagents(architectSessionId2)).toEqual([]);

      // Surveyor -> empty (leaf)
      const surveyorTask4 = manager.launch({
        agent: 'surveyor',
        prompt: 'test',
        description: 'test',
        parentSessionId: 'root-session',
      });

      await Promise.resolve();
      await Promise.resolve();

      const surveyorSessionId4 = surveyorTask4.sessionId;
      if (!surveyorSessionId4)
        throw new Error('Expected sessionId to be defined');

      expect(manager.getAllowedSubagents(surveyorSessionId4)).toEqual([]);

      // Unknown session -> orchestrator (all subagents)
      expect(manager.getAllowedSubagents('unknown-session')).toEqual([
        'surveyor',
        'synthesizer',
        'critic',
        'architect',
        'writer',
      ]);
    });
  });
});
