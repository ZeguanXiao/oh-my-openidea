import type { LocalMcpConfig } from './types';

/**
 * Zotero MCP - local stdio bridge to the user's Zotero library.
 * @see https://github.com/54yyyu/zotero-mcp
 */
export const zotero: LocalMcpConfig = {
  type: 'local',
  command: ['zotero-mcp', 'serve', '--transport', 'stdio'],
  environment: {
    ZOTERO_LOCAL: 'true',
  },
};
