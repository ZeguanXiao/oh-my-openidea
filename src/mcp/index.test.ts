import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  test('returns all builtin MCPs when no disabled list provided', () => {
    const mcps = createBuiltinMcps();
    const names = Object.keys(mcps);

    expect(names).toContain('websearch');
    expect(names).toContain('zotero');
    expect(names.length).toBe(2);
  });

  test('returns all builtin MCPs with empty disabled list', () => {
    const mcps = createBuiltinMcps([]);
    const names = Object.keys(mcps);

    expect(names.length).toBe(2);
    expect(names).toContain('websearch');
    expect(names).toContain('zotero');
  });

  test('excludes websearch when disabled', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).toContain('zotero');
    expect(names.length).toBe(1);
  });

  test('excludes all MCPs when all disabled', () => {
    const mcps = createBuiltinMcps(['websearch', 'zotero']);
    const names = Object.keys(mcps);

    expect(names.length).toBe(0);
  });

  test('ignores unknown MCP names in disabled list', () => {
    const mcps = createBuiltinMcps(['unknown_mcp', 'nonexistent']);
    const names = Object.keys(mcps);

    // All valid MCPs should still be present
    expect(names.length).toBe(2);
    expect(names).toContain('websearch');
    expect(names).toContain('zotero');
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

  test('zotero MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const zotero = mcps.zotero;

    expect(zotero).toBeDefined();
    expect('command' in zotero).toBe(true);

    if ('command' in zotero) {
      expect(zotero.command).toEqual([
        'zotero-mcp',
        'serve',
        '--transport',
        'stdio',
      ]);

      const expectedLocalMode =
        process.env.ZOTERO_LOCAL ??
        (process.env.ZOTERO_API_KEY ? undefined : 'true');
      if (expectedLocalMode) {
        expect(zotero.environment?.ZOTERO_LOCAL).toBe(expectedLocalMode);
      }
    }
  });
});
