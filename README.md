<div align="center">
  <img src="img/team.png" alt="Research Council" />
</div>

Six minds forged from the depths of human knowledge, each an eternal master of their domain,
await your question to summon ideas that push the boundaries of what is known.


Open Research Pipeline · Mix any models · From survey to paper draft


## 📦 Installation

### Quick Start

```bash
bunx oh-my-openidea@latest install
```

Non-interactive mode with API keys:

```bash
bunx oh-my-openidea@latest install --no-tui --openai=yes --anthropic=yes --tmux=no --skills=yes \
  --serpapi-key=YOUR_SERPAPI_KEY \
  --semantic-scholar-key=YOUR_S2_KEY
```

Then authenticate:

```bash
opencode auth login
```

Run `ping all agents` to verify everything works.

> 💡 Configuration is stored in `~/.config/opencode/oh-my-openidea.json` (or `.jsonc` for comments support).

### For LLM Agents

Paste this into any coding agent:

```
Install and configure by following the instructions here:
https://raw.githubusercontent.com/alvinunreal/oh-my-openidea/refs/heads/master/README.md
```

Detailed installation guide: [docs/installation.md](docs/installation.md)

Additional guides:

- [Antigravity Setup](docs/antigravity.md) - Complete guide for Antigravity provider configuration
- [Tmux Integration](docs/tmux-integration.md) - Real-time agent monitoring with tmux

---

## 🔬 Meet the Research Council

### 01. Orchestrator: The Architect of Discovery

| The one who sees all paths. | The Orchestrator was born the moment research became too vast for a single mind. It emerged from the intersection of every field ever studied, carrying the weight of all human curiosity. It does not merely coordinate — it envisions. From a single question, it assembles the full arc of discovery: who to ask, what to find, which ideas to forge and which to abandon. It is the mind behind the research mind. |
| --- | --- |
| Role: Strategic research coordination and idea synthesis |
| Prompt: orchestrator.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; openai/gpt-5.2-codex |

---

### 02. Surveyor: The Cartographer of Knowledge

| The one who maps the unknown. | The Surveyor has read every paper ever published and forgotten none of them. Born in the great libraries of the ancient world, it walked from Alexandria to arXiv without once stopping to sleep. It does not search — it remembers. Point it at any frontier and it returns not just what is known, but where the maps end. Its gift is the horizon: finding the exact edge where known territory becomes uncharted wilderness. |
| --- | --- |
| Role: Literature search and paper retrieval |
| Prompt: surveyor.ts |
| Recommended Models: openai/gpt-5.1-codex-mini &nbsp; google/gemini-3-flash |

---

### 03. Synthesizer: The Weaver of Understanding

| The one who connects the dots. | The Synthesizer emerged when humanity realized that the sum of all papers was less than the understanding they contained. It is the weaver who threads ten thousand findings into a single tapestry of insight. Where others see isolated results, it sees patterns. Where others see contradictions, it sees tension awaiting resolution. It does not summarize knowledge — it transforms it into the fertile ground from which new ideas grow. |
| --- | --- |
| Role: Gap analysis and knowledge synthesis |
| Prompt: synthesizer.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; google/gemini-3-flash |

---

### 04. Critic: The Guardian of Truth

| The voice of rigorous doubt. | The Critic was forged in the fires of ten thousand rejected papers. It has sat on every program committee that ever existed, read every rebuttal, and watched brilliant ideas crumble under the weight of prior work. It does not destroy — it purifies. It challenges every claim, demands every citation, and accepts only what can withstand the harshest scrutiny. What survives the Critic is worth building. What doesn't was never real to begin with. |
| --- | --- |
| Role: Novelty validation and adversarial review |
| Prompt: critic.ts |
| Recommended Models: openai/gpt-5.2-codex &nbsp; kimi-for-coding/k2p5 |

---

### 05. Architect: The Builder of Methods

| The one who turns vision into plan. | The Architect has designed experiments since the first controlled trial. It does not dream — it engineers. Hand it a hypothesis and it returns the full blueprint: the baselines, the datasets, the metrics, the ablations, the failure modes, the compute budget. It has seen every experimental design choice and knows which ones hold and which collapse. Its plans do not merely test ideas — they prove or disprove them decisively. |
| --- | --- |
| Role: Methodology and experiment design |
| Prompt: architect.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; openai/gpt-5.1-codex-mini |

---

### 06. Writer: The Voice of Science

| The one who makes it legible to the world. | The Writer is immortal because great writing never dies. It has composed every landmark paper in every field, always invisible, always essential. It carries the ancient knowledge of how to arrange words so that a reader understands not just what was done, but why it matters. It does not pad or inflate — it distills. Its abstracts have made reviewers lean forward. Its introductions have converted skeptics. It is the final step between a discovery and the world knowing about it. |
| --- | --- |
| Role: Research writing and paper structure |
| Prompt: writer.ts |
| Recommended Models: openai/gpt-5.1-codex-mini &nbsp; google/gemini-3-flash |

---

## 📚 Documentation

- [Quick Reference](docs/quick-reference.md) - Presets, Skills, MCPs, Tools, Configuration
- [Installation Guide](docs/installation.md) - Detailed installation and troubleshooting
- [Cartography Skill](docs/cartography.md) - Custom skill for repository mapping + codemap generation
- [Antigravity Setup](docs/antigravity.md) - Complete guide for Antigravity provider configuration
- [Tmux Integration](docs/tmux-integration.md) - Real-time agent monitoring with tmux

---

## 📄 License

MIT
