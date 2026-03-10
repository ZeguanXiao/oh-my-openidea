# Provider Combination Test Matrix (2 to 6 Active)

This matrix tests 5 combinations across the 8 provider toggles in this project:

- `openai`
- `anthropic`
- `github-copilot`
- `zai-coding-plan`
- `kimi-for-coding`
- `google` (Antigravity/Gemini)
- `chutes`
- `opencode` free (`useOpenCodeFreeModels`)

## How this was determined

I generated outputs directly from `generateLiteConfig` in `src/cli/providers.ts` using fixed deterministic inputs:

- `selectedOpenCodePrimaryModel = opencode/glm-4.7-free`
- `selectedOpenCodeSecondaryModel = opencode/gpt-5-nano`
- `selectedChutesPrimaryModel = chutes/kimi-k2.5`
- `selectedChutesSecondaryModel = chutes/minimax-m2.1`

This represents the config output shape written by the installer when those selected models are available.

## Scenario S1 - 2 providers

Active providers: OpenAI + OpenCode Free

- Preset: `openai`
- Agents:
  - `orchestrator`: `openai/gpt-5.3-codex`
  - `critic`: `openai/gpt-5.3-codex` (`high`)
  - `architect`: `openai/gpt-5.1-codex-mini` (`medium`)
  - `surveyor`: `opencode/gpt-5-nano`
  - `synthesizer`: `opencode/gpt-5-nano`
  - `writer`: `opencode/gpt-5-nano`
- Fallback chains:
  - `orchestrator`: `openai/gpt-5.3-codex -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `critic`: `openai/gpt-5.3-codex -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `architect`: `openai/gpt-5.1-codex-mini -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `surveyor`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> opencode/big-pickle`
  - `synthesizer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> opencode/big-pickle`
  - `writer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> opencode/big-pickle`

## Scenario S2 - 3 providers

Active providers: OpenAI + Chutes + OpenCode Free

- Preset: `openai`
- Agents:
  - `orchestrator`: `openai/gpt-5.3-codex`
  - `critic`: `openai/gpt-5.3-codex` (`high`)
  - `architect`: `openai/gpt-5.1-codex-mini` (`medium`)
  - `surveyor`: `opencode/gpt-5-nano`
  - `synthesizer`: `opencode/gpt-5-nano`
  - `writer`: `opencode/gpt-5-nano`
- Fallback chains:
  - `orchestrator`: `openai/gpt-5.3-codex -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `critic`: `openai/gpt-5.3-codex -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `architect`: `openai/gpt-5.1-codex-mini -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `surveyor`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `synthesizer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `writer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> chutes/minimax-m2.1 -> opencode/big-pickle`

## Scenario S3 - 4 providers

Active providers: OpenAI + Copilot + ZAI Plan + OpenCode Free

- Preset: `openai`
- Agents:
  - `orchestrator`: `openai/gpt-5.3-codex`
  - `critic`: `openai/gpt-5.3-codex` (`high`)
  - `architect`: `openai/gpt-5.1-codex-mini` (`medium`)
  - `surveyor`: `opencode/gpt-5-nano`
  - `synthesizer`: `opencode/gpt-5-nano`
  - `writer`: `opencode/gpt-5-nano`
- Fallback chains:
  - `orchestrator`: `openai/gpt-5.3-codex -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `critic`: `openai/gpt-5.3-codex -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `architect`: `openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `surveyor`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/big-pickle`
  - `synthesizer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/big-pickle`
  - `writer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> opencode/big-pickle`

## Scenario S4 - 5 providers

Active providers: OpenAI + Gemini + Chutes + Copilot + OpenCode Free

- Preset: `antigravity-mixed-openai`
- Agents:
  - `orchestrator`: `chutes/kimi-k2.5`
  - `critic`: `google/antigravity-gemini-3.1-pro` (`high`)
  - `architect`: `chutes/kimi-k2.5` (`medium`)
  - `surveyor`: `opencode/gpt-5-nano`
  - `synthesizer`: `opencode/gpt-5-nano`
  - `writer`: `opencode/gpt-5-nano`
- Fallback chains:
  - `orchestrator`: `chutes/kimi-k2.5 -> openai/gpt-5.3-codex -> github-copilot/grok-code-fast-1 -> google/antigravity-gemini-3-flash -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `critic`: `google/antigravity-gemini-3.1-pro -> openai/gpt-5.3-codex -> github-copilot/grok-code-fast-1 -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `architect`: `chutes/kimi-k2.5 -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> google/antigravity-gemini-3-flash -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `surveyor`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> google/antigravity-gemini-3-flash -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `synthesizer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> google/antigravity-gemini-3-flash -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `writer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> github-copilot/grok-code-fast-1 -> google/antigravity-gemini-3-flash -> chutes/minimax-m2.1 -> opencode/big-pickle`

## Scenario S5 - 6 providers

Active providers: OpenAI + Anthropic + Copilot + ZAI Plan + Chutes + OpenCode Free

- Preset: `openai`
- Agents:
  - `orchestrator`: `openai/gpt-5.3-codex`
  - `critic`: `openai/gpt-5.3-codex` (`high`)
  - `architect`: `openai/gpt-5.1-codex-mini` (`medium`)
  - `surveyor`: `opencode/gpt-5-nano`
  - `synthesizer`: `opencode/gpt-5-nano`
  - `writer`: `opencode/gpt-5-nano`
- Fallback chains:
  - `orchestrator`: `openai/gpt-5.3-codex -> anthropic/claude-opus-4-6 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `critic`: `openai/gpt-5.3-codex -> anthropic/claude-opus-4-6 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `architect`: `openai/gpt-5.1-codex-mini -> anthropic/claude-sonnet-4-5 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/kimi-k2.5 -> opencode/glm-4.7-free -> opencode/big-pickle`
  - `surveyor`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> anthropic/claude-haiku-4-5 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `synthesizer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> anthropic/claude-sonnet-4-5 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/minimax-m2.1 -> opencode/big-pickle`
  - `writer`: `opencode/gpt-5-nano -> openai/gpt-5.1-codex-mini -> anthropic/claude-sonnet-4-5 -> github-copilot/grok-code-fast-1 -> zai-coding-plan/glm-4.7 -> chutes/minimax-m2.1 -> opencode/big-pickle`

## Dynamic scoring rerun (new compositions + 3 random)

This rerun validates `buildDynamicModelPlan` using `scoringEngineVersion` in three modes:

- `v1`
- `v2-shadow` (applies V1 results, compares V2)
- `v2`

The exact assertions are captured in `src/cli/dynamic-model-selection-matrix.test.ts`.

### C1 (curated)

Active providers: OpenAI + Anthropic + Chutes + OpenCode Free

- V1 agents: `critic=openai/gpt-5.3-codex`, `orchestrator=openai/gpt-5.3-codex`, `writer=openai/gpt-5.1-codex-mini`, `architect=chutes/kimi-k2.5`, `synthesizer=anthropic/claude-opus-4-6`, `surveyor=anthropic/claude-haiku-4-5`
- V2 agents: `critic=openai/gpt-5.3-codex`, `orchestrator=openai/gpt-5.3-codex`, `writer=openai/gpt-5.1-codex-mini`, `architect=anthropic/claude-opus-4-6`, `synthesizer=chutes/kimi-k2.5`, `surveyor=anthropic/claude-haiku-4-5`

### C2 (curated)

Active providers: OpenAI + Copilot + ZAI Plan + Gemini + OpenCode Free

- V1 agents: `critic=google/antigravity-gemini-3.1-pro`, `orchestrator=openai/gpt-5.3-codex`, `writer=openai/gpt-5.1-codex-mini`, `architect=google/antigravity-gemini-3.1-pro`, `synthesizer=zai-coding-plan/glm-4.7`, `surveyor=github-copilot/grok-code-fast-1`
- V2 agents: same as V1 for this composition

### C3 (curated)

Active providers: Kimi + Gemini + Chutes + OpenCode Free

- V1 agents: `critic=google/antigravity-gemini-3.1-pro`, `orchestrator=google/antigravity-gemini-3.1-pro`, `writer=chutes/minimax-m2.1`, `architect=kimi-for-coding/k2p5`, `synthesizer=google/antigravity-gemini-3.1-pro`, `surveyor=google/antigravity-gemini-3-flash`
- V2 agents: same except `writer=chutes/kimi-k2.5`

### R1 (random)

Active providers: Anthropic + Copilot + OpenCode Free

- V1 agents: `critic=anthropic/claude-opus-4-6`, `orchestrator=github-copilot/grok-code-fast-1`, `writer=github-copilot/grok-code-fast-1`, `architect=anthropic/claude-opus-4-6`, `synthesizer=github-copilot/grok-code-fast-1`, `surveyor=anthropic/claude-haiku-4-5`
- V2 agents: same as V1 for this composition

### R2 (random)

Active providers: OpenAI + Kimi + ZAI Plan + Chutes + OpenCode Free

- V1 agents: `critic=openai/gpt-5.3-codex`, `orchestrator=openai/gpt-5.3-codex`, `writer=chutes/minimax-m2.1`, `architect=zai-coding-plan/glm-4.7`, `synthesizer=kimi-for-coding/k2p5`, `surveyor=chutes/minimax-m2.1`
- V2 agents: `critic=openai/gpt-5.3-codex`, `orchestrator=openai/gpt-5.3-codex`, `writer=chutes/kimi-k2.5`, `architect=kimi-for-coding/k2p5`, `synthesizer=zai-coding-plan/glm-4.7`, `surveyor=chutes/minimax-m2.1`

### R3 (random)

Active providers: Gemini + Anthropic + Chutes + OpenCode Free

- V1 agents: `critic=google/antigravity-gemini-3.1-pro`, `orchestrator=google/antigravity-gemini-3.1-pro`, `writer=chutes/minimax-m2.1`, `architect=anthropic/claude-opus-4-6`, `synthesizer=google/antigravity-gemini-3.1-pro`, `surveyor=google/antigravity-gemini-3-flash`
- V2 agents: `critic=google/antigravity-gemini-3.1-pro`, `orchestrator=google/antigravity-gemini-3.1-pro`, `writer=anthropic/claude-opus-4-6`, `architect=chutes/kimi-k2.5`, `synthesizer=google/antigravity-gemini-3.1-pro`, `surveyor=google/antigravity-gemini-3-flash`

## Notes

- This matrix shows deterministic `generateLiteConfig` output for the selected combinations.
- If the dynamic planner is used during full install (live model catalog), the generated `dynamic` preset may differ based on discovered models and capabilities.
