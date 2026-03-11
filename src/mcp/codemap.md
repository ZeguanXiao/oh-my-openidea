# src/mcp/

<!-- Explorer: Fill in this section with architectural understanding -->

## Responsibility

- Define and expose the built-in MCP endpoint (`websearch`) alongside the shared type aliases so the application can treat remote and local MCPs uniformly (`src/mcp/index.ts`, `src/mcp/types.ts`).
- Provide a single entry point (`createBuiltinMcps`) for instantiating the default connectors while honoring feature flags/disabled lists.

## Design

- `types.ts` defines the discriminated union `McpConfig` with `RemoteMcpConfig` and `LocalMcpConfig`, keeping the shape of every connector explicit and easy to validate at compile time.
- `websearch.ts` supplies a `RemoteMcpConfig` literal pointing at the first-party Exa AI MCP endpoint.
- `alphaxiv.ts` supplies a `LocalMcpConfig` for the AlphaXiv MCP server (`alphaxiv-mcp-server` stdio), providing arXiv paper search and AI-generated overviews.
- `google-scholar.ts` supplies a `LocalMcpConfig` for the Google Scholar MCP server (`python -m google_scholar_mcp_server` stdio), providing academic search via the `scholarly` Python library. No API key required.
- `zotero.ts` supplies a `LocalMcpConfig` for the Zotero MCP server, connecting to the user's local Zotero library.
- `index.ts` aggregates the built-in configs in a `Record<McpName, McpConfig>` and exposes helpers/types for external consumers, keeping the set of hard-coded MCPs centralized.

## Flow

- On startup `createBuiltinMcps` iterates over the in-module registry and filters out any MCP listed in `disabled_mcps`, returning the remaining configs as a string-keyed record for the higher-level stack (`src/index.ts`).
- Each remote config is evaluated eagerly, so the only per-request variability is the `disabled_mcps` list and the presence of environment-provided API keys for headers.

## Integration

- `src/index.ts` imports `createBuiltinMcps` to construct the MCP map used by the runtime, passing the user/cli-configured `disabled_mcps` array.
- Types exported from `src/mcp/types.ts` are re-exported by `src/mcp/index.ts`, letting other modules reference `McpConfig`, `LocalMcpConfig`, and `RemoteMcpConfig` without reaching into individual files.
- Remote configs are pure data objects consumed by the runtime's MCP execution layer (via the `McpConfig` contract) and depend only on environment-provided credentials and the URLs defined here.
