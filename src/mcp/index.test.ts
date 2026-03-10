import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  test('returns websearch MCP when no disabled list provided', () => {
    const mcps = createBuiltinMcps();
    const names = Object.keys(mcps);

    expect(names).toContain('websearch');
    expect(names.length).toBe(1);
  });

  test('returns websearch MCP with empty disabled list', () => {
    const mcps = createBuiltinMcps([]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(1);
    expect(names).toContain('websearch');
  });

  test('excludes websearch when disabled', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names.length).toBe(0);
  });

  test('excludes all MCPs when all disabled', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names.length).toBe(0);
  });

  test('ignores unknown MCP names in disabled list', () => {
    const mcps = createBuiltinMcps(['unknown_mcp', 'nonexistent']);
    const names = Object.keys(mcps);

    // All valid MCPs should still be present
    expect(names.length).toBe(1);
    expect(names).toContain('websearch');
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
});
