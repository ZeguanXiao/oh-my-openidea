---
name: literature-review
description: Conduct a structured CS/ML literature survey — searches arXiv and Semantic Scholar, synthesizes findings, and produces an annotated bibliography with a research landscape map.
---

# Literature Review Skill

This skill orchestrates a **comprehensive literature survey** on a CS/ML topic by coordinating Surveyor and Synthesizer agents through a structured workflow.

## When to Use

Use this skill when:
- Starting research on a new topic and need an overview of the field
- Building a related work section for a paper
- Identifying research gaps before generating hypotheses
- Constructing an annotated bibliography on a specific concept

## Workflow

### Step 1: Define Scope

Ask the user (or infer from context):
- **Topic**: Specific research topic or keyword (e.g., "chain-of-thought prompting", "diffusion models for 3D generation")
- **Sub-fields**: Which arXiv categories to prioritize (e.g., cs.LG, cs.CL, cs.CV)
- **Time range**: Default to last 3 years; extend to 5+ for foundational topics
- **Depth**: Quick overview (10–15 papers) vs. deep survey (30–50 papers)

### Step 2: Initial Search (Surveyor)

Launch **@surveyor** with 3 parallel searches:
1. Primary query: exact topic keywords on Semantic Scholar
2. Broad query: related concepts and parent topic on Google Scholar
3. Survey/review query: `"{topic} survey"` or `"{topic} review"` on Google Scholar for overview papers

Example delegation:
```
@surveyor: Search Semantic Scholar for "mechanistic interpretability transformers" with fields=["Computer Science"],
limit=20, min_citations=5. Also search Google Scholar for highly-cited survey papers on the same topic.
For the 3 most relevant results, fetch their AlphaXiv overviews to extract key contributions.
```

### Step 3: Citation Expansion (Surveyor)

From the initial results, select 3–5 most relevant papers and use `citation_graph` to find:
- Influential papers that cite them (forward expansion)
- Key references they all share (backward expansion to foundational work)

### Step 4: Synthesis (Synthesizer)

Launch **@synthesizer** with the full paper corpus to produce:
- **Landscape map**: Main research threads and how they relate
- **Timeline**: How the field has evolved year by year
- **Recurring benchmarks**: Which datasets/tasks are standard
- **Open problems**: Explicitly mentioned limitations and future work

### Step 5: Output

Produce a structured literature review document with:

```markdown
# Literature Review: [Topic]

## Overview
[2–3 paragraph summary of the field]

## Paper Categories
### [Category 1]
- [arXiv:XXXX] **Title** — Authors (Year) [N citations]
  *Why relevant*: ...

### [Category 2]
...

## Research Landscape
[Synthesizer's landscape map]

## Open Problems
[Synthesizer's gap analysis]

## Recommended Starting Papers
[Top 5 papers for a newcomer, with reading order]
```

### Step 6: Save

Save the landscape map and paper list to the idea store using `idea_store` with action `save` (status: `draft`) for future reference when generating hypotheses.

## Quality Criteria

- Minimum 15 papers for any useful survey
- Must include at least one survey/review paper if one exists
- All paper IDs must be verified (arXiv IDs or Semantic Scholar IDs)
- Open problems must be grounded in specific papers (not assumed)
