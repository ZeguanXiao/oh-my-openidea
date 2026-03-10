# src/

## Responsibility
- `src/index.ts` delivers the oh-my-openidea plugin by merging configuration, instantiating orchestrator/subagent definitions, wiring background managers, tmux helpers, built-in research tools, MCPs, and lifecycle hooks so OpenCode sees a single cohesive module.
- `config/`, `agents/`, `tools/`, `background/`, `hooks/`, and `utils/` contain the reusable building blocks (loader/schema/constants, agent factories/permission helpers, tool factories, background polling/session managers, hook implementations, and tmux/variant/log helpers) that power that entry point.
- `cli/` exposes the install/update script (argument parsing + interactive prompts) that edits OpenCode config, installs recommended/custom skills, and updates provider credentials to bootstrap this plugin on a host machine.

## Design
- Agent creation follows explicit factories (`agents/index.ts`, per-agent creators under `agents/`) with override/permission helpers (`config/utils.ts`, `cli/skills.ts`) so defaults live in `config/constants.ts`, prompts can be swapped via `config/loader.ts`, and variant labels propagate through `utils/agent-variant.ts`.
- Background tooling composes `BackgroundTaskManager`, `TmuxSessionManager`, and `createBackgroundTools` (which uses `tool` with Zod schemas) to provide async/sync task launches plus cancel/output helpers; polling/prompt flow lives in `tools/background.ts` while TMUX lifecycle uses `utils/tmux.ts` to spawn/close panes and reapply layouts.
- Hooks are isolated (`hooks/auto-update-checker`, `phase-reminder`, `post-read-nudge`, `idea-quality-gate`) and exported via `hooks/index.ts`, so the plugin simply registers them via the `event`, `experimental.chat.messages.transform`, and `tool.execute.after` hooks defined in `index.ts`.
- Research tools (`tools/alphaxiv`, `tools/semantic-scholar`, `tools/google-scholar`, `tools/paper-reader`, `tools/idea-store`) provide structured paper overviews via AlphaXiv, citation graphs, paper text extraction, and persistent idea storage behind the OpenCode `tool` interface.

## Flow
- Startup: `index.ts` calls `loadPluginConfig` (user + project JSON + presets) to build a `PluginConfig`, passes it to `getAgentConfigs` (which uses `createAgents`, agent factories, `loadAgentPrompt`, and `getAgentMcpList`) and to `BackgroundTaskManager`/`TmuxSessionManager`/`createBackgroundTools` so the in-memory state matches user overrides.
- Plugin registration: `index.ts` registers agents, the tool map (background/task, `alphaxiv_overview`, `alphaxiv_full_text`, `semantic_scholar_search`, `citation_graph`, `google_scholar_search`, `paper_reader`, `idea_store`), MCP definitions, and hooks; configuration hook merges those values back into the OpenCode config (default agent, permission rules, and MCP access policies).
- Runtime: `BackgroundTaskManager.launch` spins up sessions and prompts agents via the OpenCode client, `pollTask`/`pollSession` watch for idle status before resolving results, while `TmuxSessionManager` observes `session.created` events to spawn panes via `utils/tmux` and close them when sessions idle or time out.
- CLI flow: `cli/install.ts` parses flags, optionally asks interactive prompts, checks OpenCode installation, adds plugin entries via `cli/config-manager.ts`, disables default agents, writes the lite config (`cli/config-io.ts`), and installs skills (`cli/skills.ts`, `cli/custom-skills.ts`).

## Integration
- Connects directly to the OpenCode plugin API (`@opencode-ai/plugin`): registers agents/tools/mcps, responds to `session.created` and `tool.execute.after` events, injects `experimental.chat.messages.transform`, and makes RPC calls via `ctx.client`/`ctx.client.session`.
- Integrates with external APIs: AlphaXiv API (arXiv superset, free), Semantic Scholar API (optional key), SerpAPI for Google Scholar (optional key), Exa web search via MCP.
- Hooks and helpers: `hooks/auto-update-checker` reads `package.json` metadata and runs safe `bun install`; `phase-reminder` enforces the 8-phase research workflow; `post-read-nudge` promotes synthesis after paper reading; `idea-quality-gate` ensures ideas receive critic review before saving.
