import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  test('returns all MCPs when no disabled list provided', () => {
    const mcps = createBuiltinMcps();
    const names = Object.keys(mcps);

    expect(names).toContain('websearch');
    expect(names).toContain('arxiv');
    expect(names).toContain('semantic_scholar');
    expect(names).toContain('google_scholar');
  });

  test('returns all MCPs with empty disabled list', () => {
    const mcps = createBuiltinMcps([]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(4);
    expect(names).toContain('websearch');
    expect(names).toContain('arxiv');
    expect(names).toContain('semantic_scholar');
    expect(names).toContain('google_scholar');
  });

  test('excludes single disabled MCP', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).toContain('arxiv');
    expect(names).toContain('semantic_scholar');
    expect(names).toContain('google_scholar');
  });

  test('excludes multiple disabled MCPs', () => {
    const mcps = createBuiltinMcps(['websearch', 'arxiv']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).not.toContain('arxiv');
    expect(names).toContain('semantic_scholar');
    expect(names).toContain('google_scholar');
    expect(names.length).toBe(2);
  });

  test('excludes all MCPs when all disabled', () => {
    const mcps = createBuiltinMcps([
      'websearch',
      'arxiv',
      'semantic_scholar',
      'google_scholar',
    ]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(0);
  });

  test('ignores unknown MCP names in disabled list', () => {
    const mcps = createBuiltinMcps(['unknown_mcp', 'nonexistent']);
    const names = Object.keys(mcps);

    // All valid MCPs should still be present
    expect(names.length).toBe(4);
    expect(names).toContain('websearch');
    expect(names).toContain('arxiv');
    expect(names).toContain('semantic_scholar');
    expect(names).toContain('google_scholar');
  });

  test('MCP configs have required properties', () => {
    const mcps = createBuiltinMcps();

    for (const [_name, config] of Object.entries(mcps)) {
      expect(config).toBeDefined();
      // Each MCP should have either url (remote) or command (local)
      const hasUrl = 'url' in config;
      const hasCommand = 'command' in config;
      expect(hasUrl || hasCommand).toBe(true);
    }
  });

  test('websearch MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const websearch = mcps.websearch;

    expect(websearch).toBeDefined();
    expect('url' in websearch).toBe(true);
  });

  test('arxiv MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const arxiv = mcps.arxiv;

    expect(arxiv).toBeDefined();
    expect('url' in arxiv).toBe(true);
  });

  test('semantic_scholar MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const semantic_scholar = mcps.semantic_scholar;

    expect(semantic_scholar).toBeDefined();
    expect('url' in semantic_scholar).toBe(true);
  });

  test('google_scholar MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const google_scholar = mcps.google_scholar;

    expect(google_scholar).toBeDefined();
    expect('url' in google_scholar).toBe(true);
  });
});
