import type { LocalMcpConfig } from './types';

const propagatedEnvironment = Object.fromEntries(
  [
    ['ZOTERO_LOCAL', process.env.ZOTERO_LOCAL],
    ['ZOTERO_API_KEY', process.env.ZOTERO_API_KEY],
    ['ZOTERO_LIBRARY_ID', process.env.ZOTERO_LIBRARY_ID],
    ['ZOTERO_LIBRARY_TYPE', process.env.ZOTERO_LIBRARY_TYPE],
    ['ZOTERO_EMBEDDING_MODEL', process.env.ZOTERO_EMBEDDING_MODEL],
    ['ZOTERO_DB_PATH', process.env.ZOTERO_DB_PATH],
    ['OPENAI_API_KEY', process.env.OPENAI_API_KEY],
    ['OPENAI_EMBEDDING_MODEL', process.env.OPENAI_EMBEDDING_MODEL],
    ['OPENAI_BASE_URL', process.env.OPENAI_BASE_URL],
    ['GEMINI_API_KEY', process.env.GEMINI_API_KEY],
    ['GEMINI_EMBEDDING_MODEL', process.env.GEMINI_EMBEDDING_MODEL],
    ['GEMINI_BASE_URL', process.env.GEMINI_BASE_URL],
  ].filter(([, value]) => value !== undefined),
) as Record<string, string>;

if (
  propagatedEnvironment.ZOTERO_LOCAL === undefined &&
  propagatedEnvironment.ZOTERO_API_KEY === undefined
) {
  // Default to the local Zotero desktop API when the user has not configured
  // web access explicitly.
  propagatedEnvironment.ZOTERO_LOCAL = 'true';
}

/**
 * Zotero MCP - local stdio bridge to the user's Zotero library.
 * @see https://github.com/54yyyu/zotero-mcp
 */
export const zotero: LocalMcpConfig = {
  type: 'local',
  command: ['zotero-mcp', 'serve', '--transport', 'stdio'],
  environment: propagatedEnvironment,
};
