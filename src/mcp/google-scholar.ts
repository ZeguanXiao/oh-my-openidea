import type { LocalMcpConfig } from './types';

/**
 * Google Scholar MCP server - search Google Scholar for academic papers,
 * author information, and advanced academic search via Python scholarly library.
 * @see https://github.com/JackKuo666/Google-Scholar-MCP-Server
 */
export const googleScholar: LocalMcpConfig = {
  type: 'local',
  command: ['python', '-m', 'google_scholar_mcp_server'],
};
