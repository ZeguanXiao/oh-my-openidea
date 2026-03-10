```skill
---
name: idea-critique
description: Run adversarial multi-round critique on a research idea through @critic and @architect. Produces a full review report with scores, weaknesses, improvement suggestions, and a final verdict.
---
```

# Idea Critique Skill

This skill orchestrates a **rigorous adversarial review** of a research idea, mimicking the NeurIPS/ICML program committee process. It is a prerequisite before investing effort in experiment design or writing.

## When to Use

Use this skill when:
- A research hypothesis needs novelty validation before proceeding
- Preparing an idea for discussion with collaborators
- Stress-testing assumptions before writing a paper proposal
- Comparing multiple ideas to select the strongest one

## Prerequisites

You need at minimum:
- The idea's **problem statement** (one clear sentence)
- The **core proposed approach** (2–3 sentences)
- The **research context** (field + related work references)

## Workflow

### Round 1: Novelty Check (Critic)

Launch **@critic** with:
- The full idea description
- The list of related papers found during the literature survey

**@critic's job**:
1. Search arXiv and Semantic Scholar for papers that directly address this idea
2. Identify degree of overlap: exact duplicate / partial overlap / related but different
3. Report specific conflicting papers with their arXiv IDs

**Overlap classification**:
- **Exact** (≥90% overlap): Idea should be rejected or significantly reformulated
- **High** (50–90%): Core claim is addressed; must differentiate further
- **Moderate** (20–50%): Current work is related but the gap is real
- **Low** (<20%): Genuinely novel direction

### Round 2: Full Review (Critic)

If novelty check passes (overlap < 50%), run the full NeurIPS-style review:

```
Scores (1–10):
- Novelty:      X — [justification with paper citations]
- Feasibility:  X — [compute/data requirements assessment]
- Significance: X — [impact if successful]
- Clarity:      X — [how well-defined is the contribution]
- Overall:      X

Weaknesses (must identify at least 3):
1. ...
2. ...
3. ...

Strengths (must identify at least 2):
1. ...
2. ...

Concrete improvements:
1. ...
2. ...

Verdict: ACCEPT / WEAK_ACCEPT / WEAK_REJECT / REJECT
```

**Advancement threshold**: Overall ≥ 6/10.

### Round 3: Improvement (Orchestrator)

If the verdict is WEAK_REJECT or the overall score is 5–6:
1. Present @critic's weaknesses to the user
2. Generate one improved version of the idea addressing the top 2 weaknesses
3. Re-run the critique (only once — reject if still below threshold)

### Round 4: Update Idea Store

Update the idea in the idea store using `idea_store` with action `update`:
- Set `critique_done: true`
- Record the scores in `scores` field
- Update `status` to `validated` if Overall ≥ 6, or `abandoned` if rejected
- Save @critic's full review in `notes`

### Output Format

```markdown
# Critique Report: [Idea Title]

## Novelty Check
[Overlap classification + conflicting papers found]

## Review Scores
| Dimension    | Score | Key Reason                          |
|--------------|-------|-------------------------------------|
| Novelty      | X/10  | ...                                 |
| Feasibility  | X/10  | ...                                 |
| Significance | X/10  | ...                                 |
| Clarity      | X/10  | ...                                 |
| Overall      | X/10  | ...                                 |

## Weaknesses
1. ...
2. ...
3. ...

## Strengths
1. ...
2. ...

## Improvements Applied
[If a revised version was generated]

## Verdict
[ACCEPT / WEAK_ACCEPT / WEAK_REJECT / REJECT] — Proceed to `experiment-design`? [Yes / No]
```

## Quality Criteria

- @critic must run at least 3 targeted searches (not just general queries)
- Novelty must be verified with specific paper IDs, not general statements
- At least 3 weaknesses must be identified even for strong ideas
- The skill must produce a binary decision (proceed / don't proceed) at the end
