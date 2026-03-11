import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ToolContext } from '@opencode-ai/plugin';
import { createWorkspaceTool } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(): ToolContext {
  return {
    sessionID: 'test-session',
    messageID: 'test-message',
    agent: 'orchestrator',
    directory: '/tmp',
    worktree: '/tmp',
    abort: new AbortController().signal,
    metadata: () => {},
    ask: async () => {},
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('createWorkspaceTool', () => {
  let tmpDir: string;
  let execute: (args: Record<string, unknown>) => Promise<string>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-tool-test-'));
    const toolDef = createWorkspaceTool(tmpDir);
    const ctx = makeCtx();
    execute = (args: Record<string, unknown>) =>
      // biome-ignore lint/suspicious/noExplicitAny: test helper — args type is complex Zod infer
      (toolDef.execute as any)(args, ctx);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // get_state — before init
  // -------------------------------------------------------------------------

  test('get_state returns uninitialized message when workspace absent', async () => {
    const result = await execute({ action: 'get_state' });
    expect(result).toContain('not initialised');
    expect(result).toContain('.openidea');
  });

  // -------------------------------------------------------------------------
  // init
  // -------------------------------------------------------------------------

  test('init creates workspace directories and config', async () => {
    const result = await execute({ action: 'init', topic: 'test research' });
    expect(result).toContain('initialised');
    expect(result).toContain('test research');

    const workspaceDir = path.join(tmpDir, '.openidea');
    expect(fs.existsSync(workspaceDir)).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'literature'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'knowledge'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'iterations'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'config.json'))).toBe(true);
  });

  test('init writes correct config.json values', async () => {
    await execute({ action: 'init', topic: 'neural scaling' });
    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.openidea', 'config.json'), 'utf-8'),
    );
    expect(config.topic).toBe('neural scaling');
    expect(config.iteration_count).toBe(0);
    expect(config.current_iteration).toBe(0);
    expect(typeof config.created_at).toBe('string');
  });

  test('init without topic marks topic as not set', async () => {
    const result = await execute({ action: 'init' });
    expect(result).toContain('(not set)');
  });

  test('init on existing workspace reports "Resuming"', async () => {
    await execute({ action: 'init', topic: 'first init' });
    // Manually bump iteration_count so it's no longer "isNew"
    const cfgPath = path.join(tmpDir, '.openidea', 'config.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    cfg.iteration_count = 1;
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

    const result = await execute({ action: 'init', topic: 'first init' });
    expect(result).toContain('Resuming');
  });

  // -------------------------------------------------------------------------
  // save_paper / list_papers / read_paper
  // -------------------------------------------------------------------------

  test('save_paper requires paper_id', async () => {
    const result = await execute({ action: 'save_paper' });
    expect(result).toContain('paper_id is required');
  });

  test('save_paper creates a markdown file in literature/', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'save_paper',
      paper_id: 'arxiv:2301.12345',
      paper_title: 'Test Paper Title',
      paper_authors: 'Smith et al.',
      paper_year: '2023',
      paper_abstract: 'This is an abstract.',
      paper_tags: ['transformers', 'reasoning'],
      paper_notes: 'Very relevant.',
    });
    expect(result).toContain('Paper saved');

    const litDir = path.join(tmpDir, '.openidea', 'literature');
    const files = fs.readdirSync(litDir);
    expect(files.length).toBe(1);

    const content = fs.readFileSync(
      path.join(litDir, String(files[0])),
      'utf-8',
    );
    expect(content).toContain('Test Paper Title');
    expect(content).toContain('Smith et al.');
    expect(content).toContain('2023');
    expect(content).toContain('This is an abstract.');
    expect(content).toContain('transformers');
    expect(content).toContain('Very relevant.');
  });

  test('save_paper reports "updated" when overwriting an existing paper', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_paper',
      paper_id: 'arxiv:1234',
      paper_title: 'Original',
    });
    const result = await execute({
      action: 'save_paper',
      paper_id: 'arxiv:1234',
      paper_title: 'Updated',
    });
    expect(result).toContain('updated');
  });

  test('list_papers returns empty message when no papers cached', async () => {
    await execute({ action: 'init' });
    const result = await execute({ action: 'list_papers' });
    expect(result).toContain('empty');
  });

  test('list_papers returns cached paper info after saving', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_paper',
      paper_id: 'arxiv:9999',
      paper_title: 'My Saved Paper',
    });
    const result = await execute({ action: 'list_papers' });
    expect(result).toContain('My Saved Paper');
    expect(result).toContain('1 total');
  });

  test('list_papers before init returns empty message', async () => {
    const result = await execute({ action: 'list_papers' });
    expect(result).toContain('empty');
  });

  test('read_paper requires paper_id', async () => {
    const result = await execute({ action: 'read_paper' });
    expect(result).toContain('paper_id is required');
  });

  test('read_paper returns "not found" for missing paper', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'read_paper',
      paper_id: 'nonexistent',
    });
    expect(result).toContain('not found');
  });

  test('read_paper returns file content for a saved paper', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_paper',
      paper_id: 'myid:001',
      paper_title: 'Paper For Reading',
      paper_abstract: 'Read me.',
    });
    const result = await execute({
      action: 'read_paper',
      paper_id: 'myid:001',
    });
    expect(result).toContain('Paper For Reading');
    expect(result).toContain('Read me.');
  });

  // -------------------------------------------------------------------------
  // save_knowledge / read_knowledge
  // -------------------------------------------------------------------------

  test('save_knowledge requires knowledge_topic', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'save_knowledge',
      knowledge_content: 'some content',
    });
    expect(result).toContain('knowledge_topic is required');
  });

  test('save_knowledge requires knowledge_content', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'save_knowledge',
      knowledge_topic: 'landscape',
    });
    expect(result).toContain('knowledge_content is required');
  });

  test('save_knowledge writes knowledge file', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'save_knowledge',
      knowledge_topic: 'landscape',
      knowledge_content: '# Research Landscape\n\nSome content.',
    });
    expect(result).toContain('Knowledge file saved');

    const filePath = path.join(
      tmpDir,
      '.openidea',
      'knowledge',
      'landscape.md',
    );
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('Research Landscape');
  });

  test('save_knowledge with append=true appends to existing file', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'gap-analysis',
      knowledge_content: '# Gaps\n\nFirst section.',
    });
    const result = await execute({
      action: 'save_knowledge',
      knowledge_topic: 'gap-analysis',
      knowledge_content: '## New Gap\n\nAppended section.',
      knowledge_append: true,
    });
    expect(result).toContain('appended');

    const content = fs.readFileSync(
      path.join(tmpDir, '.openidea', 'knowledge', 'gap-analysis.md'),
      'utf-8',
    );
    expect(content).toContain('First section.');
    expect(content).toContain('Appended section.');
  });

  test('save_knowledge overwrites when append is false', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'key-methods',
      knowledge_content: 'Original content.',
    });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'key-methods',
      knowledge_content: 'Replacement content.',
      knowledge_append: false,
    });
    const content = fs.readFileSync(
      path.join(tmpDir, '.openidea', 'knowledge', 'key-methods.md'),
      'utf-8',
    );
    expect(content).not.toContain('Original content.');
    expect(content).toContain('Replacement content.');
  });

  test('read_knowledge lists all files when no topic given', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'landscape',
      knowledge_content: '# Landscape',
    });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'related-work',
      knowledge_content: '# Related Work',
    });
    const result = await execute({ action: 'read_knowledge' });
    expect(result).toContain('2 files');
    expect(result).toContain('landscape.md');
    expect(result).toContain('related-work.md');
  });

  test('read_knowledge with topic returns specific file content', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'landscape',
      knowledge_content: '# My Landscape\n\nDetail here.',
    });
    const result = await execute({
      action: 'read_knowledge',
      knowledge_topic: 'landscape',
    });
    expect(result).toContain('My Landscape');
    expect(result).toContain('Detail here.');
  });

  test('read_knowledge returns "not found" for missing topic', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'read_knowledge',
      knowledge_topic: 'nonexistent',
    });
    expect(result).toContain('not found');
  });

  test('read_knowledge returns empty message before any files saved', async () => {
    await execute({ action: 'init' });
    const result = await execute({ action: 'read_knowledge' });
    expect(result).toContain('empty');
  });

  // -------------------------------------------------------------------------
  // save_iteration
  // -------------------------------------------------------------------------

  test('save_iteration requires iteration_content', async () => {
    await execute({ action: 'init' });
    const result = await execute({ action: 'save_iteration' });
    expect(result).toContain('iteration_content is required');
  });

  test('save_iteration creates iteration-01.md and increments counter', async () => {
    await execute({ action: 'init' });
    const result = await execute({
      action: 'save_iteration',
      iteration_content: 'Survey focused on X. Ideas: A, B.',
    });
    expect(result).toContain('Iteration 1');
    expect(result).toContain('iteration-01.md');

    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.openidea', 'config.json'), 'utf-8'),
    );
    expect(config.iteration_count).toBe(1);
  });

  test('save_iteration creates sequential files iteration-01, iteration-02', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_iteration',
      iteration_content: 'First iteration.',
    });
    await execute({
      action: 'save_iteration',
      iteration_content: 'Second iteration.',
    });

    const iterDir = path.join(tmpDir, '.openidea', 'iterations');
    const files = fs.readdirSync(iterDir).sort();
    expect(files).toContain('iteration-01.md');
    expect(files).toContain('iteration-02.md');

    const config = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.openidea', 'config.json'), 'utf-8'),
    );
    expect(config.iteration_count).toBe(2);
  });

  test('save_iteration includes content and timestamp header in file', async () => {
    await execute({ action: 'init' });
    await execute({
      action: 'save_iteration',
      iteration_content: 'Ideas: idea-001, idea-002.',
    });
    const content = fs.readFileSync(
      path.join(tmpDir, '.openidea', 'iterations', 'iteration-01.md'),
      'utf-8',
    );
    expect(content).toContain('# Iteration 1');
    expect(content).toContain('Ideas: idea-001, idea-002.');
  });

  // -------------------------------------------------------------------------
  // get_state — after various operations
  // -------------------------------------------------------------------------

  test('get_state returns accurate counts after multiple operations', async () => {
    await execute({ action: 'init', topic: 'diffusion models' });
    await execute({
      action: 'save_paper',
      paper_id: 'p1',
      paper_title: 'Paper 1',
    });
    await execute({
      action: 'save_paper',
      paper_id: 'p2',
      paper_title: 'Paper 2',
    });
    await execute({
      action: 'save_knowledge',
      knowledge_topic: 'landscape',
      knowledge_content: 'content',
    });
    await execute({
      action: 'save_iteration',
      iteration_content: 'iter 1',
    });

    const result = await execute({ action: 'get_state' });
    expect(result).toContain('diffusion models');
    expect(result).toContain('Papers cached: 2');
    expect(result).toContain('landscape.md');
    expect(result).toContain('iteration-01.md');
    expect(result).toContain('Iterations completed: 1');
  });
});
