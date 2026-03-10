import type { RemoteMcpConfig } from './types';

/**
 * arXiv MCP via the Community arxiv-mcp-server (smithery).
 * Provides paper search, PDF reading, and paper info retrieval.
 * @see https://smithery.ai/server/@joshuarileydev/arxiv-mcp-server
 *
 * Falls back to remote hosted instance if available.
 * No API key required — arXiv API is free.
 */
export const arxiv: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://server.smithery.ai/@joshuarileydev/arxiv-mcp-server/mcp',
  oauth: false,
};
