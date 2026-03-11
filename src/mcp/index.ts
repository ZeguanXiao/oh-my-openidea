import type { McpName } from '../config';
import { alphaxiv } from './alphaxiv';
import { googleScholar } from './google-scholar';
import type { McpConfig } from './types';
import { websearch } from './websearch';
import { zotero } from './zotero';

export type { LocalMcpConfig, McpConfig, RemoteMcpConfig } from './types';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  alphaxiv,
  'google-scholar': googleScholar,
  websearch,
  zotero,
};

/**
 * Creates MCP configurations, excluding disabled ones
 */
export function createBuiltinMcps(
  disabledMcps: readonly string[] = [],
): Record<string, McpConfig> {
  return Object.fromEntries(
    Object.entries(allBuiltinMcps).filter(
      ([name]) => !disabledMcps.includes(name),
    ),
  );
}
