import type { RemoteMcpConfig } from './types';

/**
 * Google Scholar search via the community google-scholar-mcp-server.
 * Provides broad academic search coverage, useful for finding surveys and classics.
 *
 * Requires SERPAPI_KEY environment variable for the underlying SerpAPI service.
 * If not set, this MCP should be disabled in config via disabled_mcps.
 * @see https://serpapi.com/google-scholar-api
 */
export const google_scholar: RemoteMcpConfig = {
  type: 'remote',
  url: 'https://server.smithery.ai/@nickclyde/google-scholar-mcp-server/mcp',
  headers: process.env.SERPAPI_KEY
    ? { 'x-serpapi-key': process.env.SERPAPI_KEY }
    : undefined,
  oauth: false,
};
