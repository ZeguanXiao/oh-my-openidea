import type { McpName } from '../config';
import type { McpConfig } from './types';
import { alphaxiv } from './alphaxiv';
import { websearch } from './websearch';
import { zotero } from './zotero';

export type { LocalMcpConfig, McpConfig, RemoteMcpConfig } from './types';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  alphaxiv,
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
