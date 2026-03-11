import { describe, expect, test } from 'bun:test';
import type { PluginConfig } from '../config';
import { SUBAGENT_NAMES } from '../config';
import { createAgents, getAgentConfigs, isSubagent } from './index';

describe('agent alias backward compatibility', () => {
  test("applies 'search' config to 'surveyor' agent", () => {
    const config: PluginConfig = {
      agents: {
        search: { model: 'test/old-search-model' },
      },
    };
    const agents = createAgents(config);
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor).toBeDefined();
    expect(surveyor?.config.model).toBe('test/old-search-model');
  });

  test("applies 'review' config to 'critic' agent", () => {
    const config: PluginConfig = {
      agents: {
        review: { model: 'test/old-review-model' },
      },
    };
    const agents = createAgents(config);
    const critic = agents.find((a) => a.name === 'critic');
    expect(critic).toBeDefined();
    expect(critic?.config.model).toBe('test/old-review-model');
  });

  test('new name takes priority over old alias', () => {
    const config: PluginConfig = {
      agents: {
        search: { model: 'old-model' },
        surveyor: { model: 'new-model' },
      },
    };
    const agents = createAgents(config);
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor?.config.model).toBe('new-model');
  });

  test('new agent names work directly', () => {
    const config: PluginConfig = {
      agents: {
        surveyor: { model: 'direct-surveyor' },
        critic: { model: 'direct-critic' },
      },
    };
    const agents = createAgents(config);
    expect(agents.find((a) => a.name === 'surveyor')?.config.model).toBe(
      'direct-surveyor',
    );
    expect(agents.find((a) => a.name === 'critic')?.config.model).toBe(
      'direct-critic',
    );
  });

  test('temperature override via alias', () => {
    const config: PluginConfig = {
      agents: {
        search: { temperature: 0.5 },
      },
    };
    const agents = createAgents(config);
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor?.config.temperature).toBe(0.5);
  });

  test('variant override via alias', () => {
    const config: PluginConfig = {
      agents: {
        search: { variant: 'low' },
      },
    };
    const agents = createAgents(config);
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor?.config.variant).toBe('low');
  });
});

describe('writer agent fallback', () => {
  test('writer inherits synthesizer model when no writer config provided', () => {
    const config: PluginConfig = {
      agents: {
        synthesizer: { model: 'synthesizer-custom-model' },
      },
    };
    const agents = createAgents(config);
    const writer = agents.find((a) => a.name === 'writer');
    const synthesizer = agents.find((a) => a.name === 'synthesizer');
    expect(writer?.config.model).toBe(synthesizer?.config.model);
  });

  test('writer uses its own model when explicitly configured', () => {
    const config: PluginConfig = {
      agents: {
        synthesizer: { model: 'synthesizer-model' },
        writer: { model: 'writer-specific-model' },
      },
    };
    const agents = createAgents(config);
    const writer = agents.find((a) => a.name === 'writer');
    expect(writer?.config.model).toBe('writer-specific-model');
  });
});

describe('orchestrator agent', () => {
  test('orchestrator is first in agents array', () => {
    const agents = createAgents();
    expect(agents[0].name).toBe('orchestrator');
  });

  test('orchestrator has question permission set to allow', () => {
    const agents = createAgents();
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.permission).toBeDefined();
    expect((orchestrator?.config.permission as any).question).toBe('allow');
  });

  test('orchestrator accepts overrides', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: { model: 'custom-orchestrator-model', temperature: 0.3 },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.model).toBe('custom-orchestrator-model');
    expect(orchestrator?.config.temperature).toBe(0.3);
  });

  test('orchestrator accepts variant override', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: { variant: 'high' },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?.config.variant).toBe('high');
  });

  test('orchestrator stores model array with per-model variants in _modelArray', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: {
          model: [
            { id: 'google/gemini-3-pro', variant: 'high' },
            { id: 'github-copilot/claude-3.5-haiku' },
            'openai/gpt-4',
          ],
        },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator?._modelArray).toEqual([
      { id: 'google/gemini-3-pro', variant: 'high' },
      { id: 'github-copilot/claude-3.5-haiku' },
      { id: 'openai/gpt-4' },
    ]);
    expect(orchestrator?.config.model).toBeUndefined();
  });
});

describe('per-model variant in array config', () => {
  test('subagent stores model array with per-model variants', () => {
    const config: PluginConfig = {
      agents: {
        surveyor: {
          model: [
            { id: 'google/gemini-3-flash', variant: 'low' },
            'openai/gpt-4o-mini',
          ],
        },
      },
    };
    const agents = createAgents(config);
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor?._modelArray).toEqual([
      { id: 'google/gemini-3-flash', variant: 'low' },
      { id: 'openai/gpt-4o-mini' },
    ]);
    expect(surveyor?.config.model).toBeUndefined();
  });

  test('top-level variant preserved alongside per-model variants', () => {
    const config: PluginConfig = {
      agents: {
        orchestrator: {
          model: [
            { id: 'google/gemini-3-pro', variant: 'high' },
            'openai/gpt-4',
          ],
          variant: 'low',
        },
      },
    };
    const agents = createAgents(config);
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    // top-level variant still set as default
    expect(orchestrator?.config.variant).toBe('low');
    // per-model variants stored in _modelArray
    expect(orchestrator?._modelArray?.[0]?.variant).toBe('high');
    expect(orchestrator?._modelArray?.[1]?.variant).toBeUndefined();
  });
});

describe('skill permissions', () => {
  test('orchestrator gets wildcard skill allowed by default', () => {
    const agents = createAgents();
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator).toBeDefined();
    const skillPerm = (
      orchestrator?.config.permission as Record<string, unknown>
    )?.skill as Record<string, string>;
    // orchestrator gets wildcard allow from RECOMMENDED_SKILLS
    expect(skillPerm?.['*']).toBe('allow');
  });

  test('surveyor gets literature-review skill allowed by default', () => {
    const agents = createAgents();
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor).toBeDefined();
    const skillPerm = (surveyor?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['literature-review']).toBe('allow');
  });

  test('critic gets idea-critique skill allowed by default', () => {
    const agents = createAgents();
    const critic = agents.find((a) => a.name === 'critic');
    expect(critic).toBeDefined();
    const skillPerm = (critic?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['idea-critique']).toBe('allow');
  });
});

describe('isSubagent type guard', () => {
  test('returns true for valid subagent names', () => {
    expect(isSubagent('surveyor')).toBe(true);
    expect(isSubagent('synthesizer')).toBe(true);
    expect(isSubagent('critic')).toBe(true);
    expect(isSubagent('architect')).toBe(true);
    expect(isSubagent('writer')).toBe(true);
  });

  test('returns false for orchestrator', () => {
    expect(isSubagent('orchestrator')).toBe(false);
  });

  test('returns false for invalid agent names', () => {
    expect(isSubagent('invalid-agent')).toBe(false);
    expect(isSubagent('')).toBe(false);
    expect(isSubagent('search')).toBe(false); // old alias, not actual agent name
  });
});

describe('agent classification', () => {
  test('SUBAGENT_NAMES excludes orchestrator', () => {
    expect(SUBAGENT_NAMES).not.toContain('orchestrator');
    expect(SUBAGENT_NAMES).toContain('surveyor');
    expect(SUBAGENT_NAMES).toContain('writer');
  });

  test('getAgentConfigs applies correct classification visibility and mode', () => {
    const configs = getAgentConfigs();

    // Primary agent
    expect(configs.orchestrator.mode).toBe('primary');

    // Subagents
    for (const name of SUBAGENT_NAMES) {
      expect(configs[name].mode).toBe('subagent');
    }
  });
});

describe('createAgents', () => {
  test('creates all agents without config', () => {
    const agents = createAgents();
    const names = agents.map((a) => a.name);
    expect(names).toContain('orchestrator');
    expect(names).toContain('surveyor');
    expect(names).toContain('synthesizer');
    expect(names).toContain('critic');
    expect(names).toContain('architect');
    expect(names).toContain('writer');
  });

  test('creates exactly 6 agents (1 primary + 5 subagents)', () => {
    const agents = createAgents();
    expect(agents.length).toBe(6);
  });
});

describe('getAgentConfigs', () => {
  test('returns config record keyed by agent name', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator).toBeDefined();
    expect(configs.surveyor).toBeDefined();
    expect(configs.surveyor.model).toBeDefined();
  });

  test('includes description in SDK config', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator.description).toBeDefined();
    expect(configs.surveyor.description).toBeDefined();
  });
});

describe('skill permissions', () => {
  test('orchestrator gets cartography skill allowed by default', () => {
    const agents = createAgents();
    const orchestrator = agents.find((a) => a.name === 'orchestrator');
    expect(orchestrator).toBeDefined();
    const skillPerm = (
      orchestrator?.config.permission as Record<string, unknown>
    )?.skill as Record<string, string>;
    expect(skillPerm?.['*']).toBe('allow');
    expect(skillPerm?.cartography).toBe('allow');
  });

  test('surveyor gets literature-review skill allowed by default', () => {
    const agents = createAgents();
    const surveyor = agents.find((a) => a.name === 'surveyor');
    expect(surveyor).toBeDefined();
    const skillPerm = (surveyor?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['literature-review']).toBe('allow');
  });

  test('critic gets idea-critique skill allowed by default', () => {
    const agents = createAgents();
    const critic = agents.find((a) => a.name === 'critic');
    expect(critic).toBeDefined();
    const skillPerm = (critic?.config.permission as Record<string, unknown>)
      ?.skill as Record<string, string>;
    expect(skillPerm?.['idea-critique']).toBe('allow');
  });
});

describe('isSubagent type guard', () => {
  test('returns true for valid subagent names', () => {
    expect(isSubagent('surveyor')).toBe(true);
    expect(isSubagent('synthesizer')).toBe(true);
    expect(isSubagent('critic')).toBe(true);
    expect(isSubagent('architect')).toBe(true);
    expect(isSubagent('writer')).toBe(true);
  });

  test('returns false for orchestrator', () => {
    expect(isSubagent('orchestrator')).toBe(false);
  });

  test('returns false for invalid agent names', () => {
    expect(isSubagent('invalid-agent')).toBe(false);
    expect(isSubagent('')).toBe(false);
    expect(isSubagent('search')).toBe(false); // old alias, not actual agent name
  });
});

describe('agent classification', () => {
  test('SUBAGENT_NAMES excludes orchestrator', () => {
    expect(SUBAGENT_NAMES).not.toContain('orchestrator');
    expect(SUBAGENT_NAMES).toContain('surveyor');
    expect(SUBAGENT_NAMES).toContain('writer');
  });

  test('getAgentConfigs applies correct classification visibility and mode', () => {
    const configs = getAgentConfigs();

    // Primary agent
    expect(configs.orchestrator.mode).toBe('primary');

    // Subagents
    for (const name of SUBAGENT_NAMES) {
      expect(configs[name].mode).toBe('subagent');
    }
  });
});

describe('createAgents', () => {
  test('creates all agents without config', () => {
    const agents = createAgents();
    const names = agents.map((a) => a.name);
    expect(names).toContain('orchestrator');
    expect(names).toContain('surveyor');
    expect(names).toContain('synthesizer');
    expect(names).toContain('critic');
    expect(names).toContain('architect');
    expect(names).toContain('writer');
  });

  test('creates exactly 6 agents (1 primary + 5 subagents)', () => {
    const agents = createAgents();
    expect(agents.length).toBe(6);
  });
});

describe('getAgentConfigs', () => {
  test('returns config record keyed by agent name', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator).toBeDefined();
    expect(configs.surveyor).toBeDefined();
    expect(configs.surveyor.model).toBeDefined();
  });

  test('includes description in SDK config', () => {
    const configs = getAgentConfigs();
    expect(configs.orchestrator.description).toBeDefined();
    expect(configs.surveyor.description).toBeDefined();
  });
});
