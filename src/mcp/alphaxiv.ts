import type { LocalMcpConfig } from './types';

/**
 * AlphaXiv MCP server - search arXiv papers and fetch AlphaXiv AI-generated
 * overviews and full text extractions via stdio.
 * @see https://github.com/xiaozg/alphaxiv-mcp-server
 */
export const alphaxiv: LocalMcpConfig = {
  type: 'local',
  command: ['alphaxiv-mcp-server'],
};
