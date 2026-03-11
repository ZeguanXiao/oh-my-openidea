---
name: paper-outline
description: Generate a full publication-ready paper outline with section summaries, abstract, and introduction draft. Designed for ideas that have passed critique and have an experimental plan.
---

# Paper Outline Skill

This skill produces a **structured, submission-ready paper outline** for a validated research idea with a complete experimental plan. Output is formatted for LaTeX / Overleaf manuscript preparation.

## When to Use

Use this skill when:
- Ready to start writing after idea is validated and experiment plan is complete
- Preparing a paper proposal for advisor/collaborator review
- Creating a workshop paper or short submission
- Generating an outline before running experiments (to align on scope)

## Prerequisites

- Completed **Idea Generation stage** (`.openidea/` workspace with full knowledge base)
- Validated research idea (status: `validated` or `in_progress` in idea store)
- Experimental plan (from `experiment-design` skill, stored in `methodology` field of the idea)
- Related work cached in `.openidea/literature/` and summarised in `.openidea/knowledge/related-work.md`

## Workflow

### Step 0: Load Workspace Context

Before generating the outline:
1. Call `workspace get_state` to confirm the workspace is initialised.
2. Call `workspace read_knowledge` for all knowledge files (landscape.md, gap-analysis.md, related-work.md).
3. Retrieve the validated idea from `idea_store` (action: `get`, including the `methodology` field).

This grounds the outline in the accumulated understanding and avoids inventing related work.

### Step 1: Context Ingestion

Collect and structure:
- Idea: problem statement + core approach
- Experimental plan: method, baselines, datasets, metrics
- Related papers: grouped by sub-topic
- Key claims: what the paper proves (1 main claim + 2–3 supporting claims)

### Step 2: Title and Framing (Self — Orchestrator)

Generate 3 candidate titles following these patterns:
- **Descriptive**: "Method Name: Improving X by Y via Z"
- **Problem-framing**: "Why Does X Fail? Insights and a Solution via Y"
- **Results-driven**: "X% Better Y with Simple Z"

Select the best one with brief justification.

### Step 3: Outline Generation (Writer)

Launch **@writer** with the full context. The writer produces:

```
Paper: [Title]

Abstract (draft):
[150–250 words covering: motivation → problem → approach → key result → significance]

Section 1: Introduction
  - Hook: [what readers care about]
  - Problem statement: [precise formulation with {formal notation placeholder}]
  - Our approach: [brief preview]
  - Contributions: [3–5 bullet points — be specific: "We prove X", "We show Y improves Z by W%"]
  - Organization: [one sentence]
  Estimated length: 1.5–2 pages

Section 2: Related Work  
  - [Subsection for each related area, 2–4 papers each]
  - Position statement: [explicit contrast with our approach for each subsection]
  Estimated length: 1–1.5 pages

Section 3: Method / Approach / Model
  - 3.1 Problem Formulation: [{formal notation} — define all variables]
  - 3.2 [Core component 1]: [description + figure placeholder]
  - 3.3 [Core component 2]: [description + equation placeholders]
  - 3.4 Theoretical Analysis: [if applicable — key theorems/proofs to include]
  Estimated length: 2–3 pages

Section 4: Experiments
  - 4.1 Experimental Setup: [datasets, baselines, metrics, hardware, hyperparams]
  - 4.2 Main Results: [table placeholder — rows × columns × expected numbers]
  - 4.3 Ablation Studies: [ablation table placeholder]
  - 4.4 Analysis and Discussion: [key findings to highlight]
  Estimated length: 2.5–3 pages

Section 5: Conclusion
  - Summary: [2 sentences on what we showed]
  - Limitations: [3 honest limitations — required by NeurIPS checklist]
  - Future Work: [3 natural extensions]
  Estimated length: 0.5 pages

References: [estimated 25–40 citations]

Total estimated page count: 8–10 pages (NeurIPS/ICML main track)
```

### Step 4: Section Drafts (Writer)

Optionally draft prose for:
- **Introduction** (usually best to draft early)
- **Abstract** (written last but planned first)
- **Related Work** (can be templated from literature survey)

Launch **@writer** for each section separately for higher quality.

### Step 5: Checklist

Run the NeurIPS reproducibility checklist:
- [ ] All claims in the paper are supported by an experiment or proof
- [ ] Datasets are publicly available or release plan is described
- [ ] Compute requirements are stated
- [ ] All hyperparameters are reported
- [ ] Code will be released (checkbox required)
- [ ] Limitations section exists

### Step 6: Save and Output

Update idea in `idea_store` (action: `update`):
- Store outline in `outline` field
- Update status to `in_progress` (if not already)

Produce a final markdown document:

```markdown
# Paper Outline: [Title]
[Full structured outline from Step 3]

## Section Drafts
[If requested]

## NeurIPS Checklist
[From Step 5]
```

## Quality Criteria

- Title must avoid hyperbole ("novel", "revolutionary", "unprecedented")
- Contributions must be specific and verifiable claims (not vague improvements)
- Abstract must mention the key quantitative result (even if estimated)
- Limitations section must be honest (not "limited to supervised learning" as the only limitation)
- Introduction must contrast with the 3 most related papers explicitly
