import type { RemoteMcpConfig, LocalMcpConfig } from './types';

/**
 * Semantic Scholar MCP.
 * Searches papers, retrieves citation graphs and paper details via the free S2 API.
 *
 * Uses the community semantic-scholar-mcp-server via Smithery.
 * Optionally set SEMANTIC_SCHOLAR_API_KEY for higher rate limits.
 * @see https://www.semanticscholar.org/product/api
 */

type McpConfig = RemoteMcpConfig | LocalMcpConfig;

const remoteConfig: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://server.smithery.ai/@contextco/semantic-scholar-mcp/mcp',
  headers: process.env.SEMANTIC_SCHOLAR_API_KEY
    ? { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY }
    : undefined,
  oauth: false,
};

export const semantic_scholar: McpConfig = remoteConfig;
