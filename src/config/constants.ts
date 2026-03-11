// Agent names
export const AGENT_ALIASES: Record<string, string> = {
  search: 'surveyor',
  review: 'critic',
  design: 'architect',
  synthesize: 'synthesizer',
  write: 'writer',
};

export const SUBAGENT_NAMES = [
  'surveyor',
  'synthesizer',
  'critic',
  'architect',
  'writer',
] as const;

export const ORCHESTRATOR_NAME = 'orchestrator' as const;

export const ALL_AGENT_NAMES = [ORCHESTRATOR_NAME, ...SUBAGENT_NAMES] as const;

// Agent name type (for use in DEFAULT_MODELS)
export type AgentName = (typeof ALL_AGENT_NAMES)[number];

// Subagent delegation rules: which agents can spawn which subagents
// orchestrator: can spawn all subagents (full delegation)
// synthesizer: can delegate to surveyor for follow-up literature searches
// critic: can delegate to surveyor for targeted novelty-check searches
// surveyor/architect/writer: leaf nodes — cannot spawn subagents
export const SUBAGENT_DELEGATION_RULES: Record<AgentName, readonly string[]> = {
  orchestrator: SUBAGENT_NAMES,
  synthesizer: ['surveyor'],
  critic: ['surveyor'],
  surveyor: [],
  architect: [],
  writer: [],
};

// Agents that have read access to the workspace tool
// Write actions (save_paper, save_knowledge, save_iteration) are restricted to
// orchestrator, surveyor, and synthesizer via tool-level prompt instructions.
export const WORKSPACE_TOOL_AGENTS: readonly AgentName[] = [
  'orchestrator',
  'surveyor',
  'synthesizer',
  'critic',
  'architect',
  'writer',
] as const;

// Default models for each agent
// orchestrator is undefined so its model is fully resolved at runtime via priority fallback
export const DEFAULT_MODELS: Record<AgentName, string | undefined> = {
  orchestrator: undefined,
  critic: 'openai/gpt-4.1',
  synthesizer: 'openai/gpt-4.1',
  surveyor: 'openai/gpt-4.1-mini',
  architect: 'openai/gpt-4.1',
  writer: 'openai/gpt-4.1-mini',
};

// Polling configuration
export const POLL_INTERVAL_MS = 500;
export const POLL_INTERVAL_SLOW_MS = 1000;
export const POLL_INTERVAL_BACKGROUND_MS = 2000;

// Timeouts
export const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
export const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const FALLBACK_FAILOVER_TIMEOUT_MS = 15_000;

// Polling stability
export const STABLE_POLLS_THRESHOLD = 3;
