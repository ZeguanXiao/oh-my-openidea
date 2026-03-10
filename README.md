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
https://raw.githubusercontent.com/ZeguanXiao/oh-my-openidea/refs/heads/master/README.md
```

Detailed installation guide: [docs/installation.md](docs/installation.md)

Additional guides:

- [Antigravity Setup](docs/antigravity.md) - Complete guide for Antigravity provider configuration
- [Tmux Integration](docs/tmux-integration.md) - Real-time agent monitoring with tmux

---

## 🔬 Meet the Research Council

### 01. Orchestrator: The Architect of Discovery

| The one who sees all paths. | The Orchestrator is the lead coordinator for the whole research workflow. Give it a problem, and it decides which agents should work next, what information is still missing, and how the pieces should come together into a strong research direction. |
| --- | --- |
| Role: Strategic research coordination and idea synthesis |
| Prompt: orchestrator.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; openai/gpt-5.2-codex |

---

### 02. Surveyor: The Cartographer of Knowledge

| The one who maps the unknown. | The Surveyor finds and collects the most relevant papers for your topic. It helps you quickly understand what has already been done, which papers matter most, and where the current limits of the literature are. |
| --- | --- |
| Role: Literature search and paper retrieval |
| Prompt: surveyor.ts |
| Recommended Models: openai/gpt-5.1-codex-mini &nbsp; google/gemini-3-flash |

---

### 03. Synthesizer: The Weaver of Understanding

| The one who connects the dots. | The Synthesizer turns a pile of papers into a clear understanding of the field. It groups results, highlights patterns and disagreements, and points out open problems that can lead to new research ideas. |
| --- | --- |
| Role: Gap analysis and knowledge synthesis |
| Prompt: synthesizer.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; google/gemini-3-flash |

---

### 04. Critic: The Guardian of Truth

| The voice of rigorous doubt. | The Critic stress-tests your idea before you invest too much in it. It looks for weak assumptions, missing baselines, overlap with prior work, and other reasons the idea might fail novelty or review standards. |
| --- | --- |
| Role: Novelty validation and adversarial review |
| Prompt: critic.ts |
| Recommended Models: openai/gpt-5.2-codex &nbsp; kimi-for-coding/k2p5 |

---

### 05. Architect: The Builder of Methods

| The one who turns vision into plan. | The Architect converts an idea into a concrete experiment plan. It defines datasets, baselines, metrics, ablations, failure cases, and resource needs so you know exactly how to test whether the idea works. |
| --- | --- |
| Role: Methodology and experiment design |
| Prompt: architect.ts |
| Recommended Models: kimi-for-coding/k2p5 &nbsp; openai/gpt-5.1-codex-mini |

---

### 06. Writer: The Voice of Science

| The one who makes it legible to the world. | The Writer turns your research into a clear paper draft. It helps organize the story, sharpen the main message, and present the method and results in a way that is easy for readers and reviewers to follow. |
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
