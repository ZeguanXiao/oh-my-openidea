---
name: hypothesis-generation
description: Generate, score, and rank novel CS/ML research hypotheses based on identified literature gaps. Produces 3–5 concrete, differentiated ideas with preliminary novelty assessments.
---

# Hypothesis Generation Skill

This skill takes a **literature landscape map** (from the literature-review skill or a direct description of the field) and generates **concrete, original research hypotheses** ranked by novelty and feasibility.

## When to Use

Use this skill when:
- You have a gap analysis and want to convert it into testable research ideas
- Brainstorming multiple research directions to compare before committing
- Generating variations of an initial idea to find the strongest formulation

## Prerequisites

You should have:
- A research topic or field description
- Ideally: output from the `literature-review` skill (landscape map + gaps)

If no prior literature review is available, the orchestrator will run a quick survey first.

## Workflow

### Step 1: Ingest Landscape

Parse the provided landscape map or gap analysis. Extract:
- The 3 most promising gaps (evidence-backed, non-trivial)
- The dominant methodology paradigm in the field
- Key open benchmarks or evaluation axes

### Step 2: Generate Hypotheses (Self — Orchestrator)

For each gap, generate 1–2 research hypotheses using this template:

```
**Hypothesis [N]**: [One-sentence claim]
- **Problem**: [What is missing or broken]
- **Proposed approach**: [Core idea in 2–3 sentences]
- **Motivation**: [Why this might work — theoretical or empirical grounding]
- **Distinguishing factor**: [What makes this different from existing work]
- **Preliminary novelty confidence**: [High / Medium / Low] — [Reason]
```

**Diversity constraint**: Hypotheses must differ in at least one of: (a) methodology family (e.g., don't generate 5 fine-tuning ideas), (b) problem framing, (c) target application domain.

### Step 3: Quick Deduplication (Surveyor)

For each hypothesis, run a targeted Semantic Scholar search to check if an obvious direct solution exists.
Use `semantic_scholar_search` with the core claim as the query. This is a quick check — deep validation happens in the `idea-critique` skill.

Example: For "hypothesis: sparse attention patterns can be learned from dense attention", search:
`semantic_scholar_search(query="learning sparse attention patterns", fields_of_study=["Computer Science"], limit=10)`

### Step 4: Score and Rank

Score each surviving hypothesis on:
| Criterion | Weight | Description |
|-----------|--------|-------------|
| Novelty | 40% | How differentiated from existing work |
| Feasibility | 30% | Can be done in 6–12 months with standard compute |
| Significance | 20% | Would matter if it worked |
| Clarity | 10% | Is the claim testable and well-defined |

Rank by weighted score. Present top 3–5.

### Step 5: Output

```markdown
# Research Hypotheses: [Topic]

Generated: [date]
Based on: [literature source]

## Ranked Hypotheses

### 🥇 Hypothesis 1: [Title]
**Score**: Novelty X/10 | Feasibility X/10 | Significance X/10 | Overall X/10
**Problem**: ...
**Approach**: ...
**Why novel**: ...
**Key risk**: ...
**Recommended next step**: Run `idea-critique` skill to validate novelty

### 🥈 Hypothesis 2: [Title]
...
```

### Step 6: Save

Save the top 3 hypotheses to the idea store using `idea_store` with action `save` (status: `draft`).

## Quality Criteria

- Each hypothesis must be **specific and testable** (not "explore X" but "propose method Y to improve Z by doing W")
- Must cite at least one supporting gap from the previous literature review
- No two hypotheses may address the same gap in the same way
- Quick deduplication search is mandatory before ranking
