import type { McpName } from '../config';
import { arxiv } from './arxiv';
import { google_scholar } from './google-scholar';
import { semantic_scholar } from './semantic-scholar';
import type { McpConfig } from './types';
import { websearch } from './websearch';

export type { LocalMcpConfig, McpConfig, RemoteMcpConfig } from './types';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  websearch,
  arxiv,
  semantic_scholar,
  google_scholar,
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
