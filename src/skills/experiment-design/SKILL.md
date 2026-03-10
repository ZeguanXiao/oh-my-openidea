```skill
---
name: experiment-design
description: Design a complete, publication-ready experimental plan for a validated research idea — including method, baselines, datasets, evaluation metrics, ablations, and compute estimate.
---
```

# Experiment Design Skill

This skill produces a **concrete, executable experimental plan** for a validated research idea. It is designed to run after `idea-critique` confirms an idea is worth pursuing (Overall ≥ 6/10).

## When to Use

Use this skill when:
- A research idea has passed the critique quality gate
- You need to specify exactly how to run experiments before writing any code
- Preparing a research proposal, grant application, or lab presentation
- Collaborating with team members who need a precise implementation spec

## Prerequisites

- Validated research idea (from `idea-critique` skill, status: `validated`)
- Literature landscape map (to know what baselines exist)
- Rough sense of compute available

## Workflow

### Step 1: Baseline Identification (Surveyor + Architect)

Launch **@surveyor** to find the current state-of-the-art on the target benchmark(s).
Specifically:
- Find the top-performing methods from the last 2 years
- Retrieve their code/checkpoint links
- Identify what exact evaluation protocol they use

Then launch **@architect** with:
- The validated idea description
- The baseline landscape from Surveyor

### Step 2: Dataset Selection (Architect)

For each candidate dataset, **@architect** evaluates:
1. **Relevance**: Does it directly test the core claim?
2. **Accessibility**: Is it publicly available? License?
3. **Standard**: Is it used in related work (essential for comparison)?
4. **Size**: Is it large enough to show statistical significance?

Select:
- 1–2 **primary datasets** (the ones the paper centers on)
- 1–2 **secondary datasets** (for generalization / ablation)

### Step 3: Metric Definition (Architect)

Define evaluation metrics:
- **Primary metric**: Used for the main table headline (must match related work's primary)
- **Secondary metrics**: Complementary signals
- **Statistical considerations**: Significance test, number of seeds, confidence intervals

**Anti-patterns to avoid**:
- Reporting only metrics where the method looks best
- Using a non-standard metric without justification
- No statistical significance testing for close results

### Step 4: Ablation Plan (Architect)

Design ablations that prove each claimed contribution independently.

Rule: **Every claim in the paper must be supported by at least one ablation.**

Template:
```
Ablation plan:
1. Full model (proposed method) — baseline for ablation comparison
2. Remove [component X] — tests that X is necessary
3. Replace [component X] with [standard alternative] — tests that X is better than the obvious alternative
4. Replace [component Y] with [simpler version] — tests sensitivity
5. [Domain generalization]: apply to [different dataset] — tests claim of general applicability
```

### Step 5: Compute Estimate (Architect)

For each experiment:
- Model size and architecture
- Training/inference hardware requirements
- Estimated wall-clock time
- Total GPU-hours

Flag if total compute exceeds reasonable academic budget (>1000 GPU-hours on A100).

### Step 6: Implementation Notes (Architect)

Key decisions to document:
- Framework (PyTorch version, key libraries)
- Any non-obvious hyperparameter choices
- Potential implementation traps (numerical stability, memory optimization)
- Code structure recommendations

### Step 7: Output and Save

```markdown
# Experimental Plan: [Idea Title]

## Method Overview
[2–3 sentences describing the approach precisely enough to implement]

## Baselines
| Method | Paper | Code | Why essential |
|--------|-------|------|---------------|
| ...    | ...   | ...  | ...           |

## Datasets
| Dataset | Task | Size | Primary/Secondary | License | URL |
|---------|------|------|-------------------|---------|-----|
| ...     | ...  | ...  | ...               | ...     | ... |

## Evaluation Protocol
- Primary metric: [name] — [definition and justification]  
- Secondary metrics: [list]
- Statistical test: [test name], [min N seeds], [CI level]

## Ablation Plan
1. ...
2. ...
(see Phase 4)

## Compute Estimate
| Experiment | Hardware | Time | GPU-Hours |
|------------|----------|------|-----------|
| Main training | 4× A100 | Xh | X |
| Ablation | 2× A100 | Xh each | X total |
| Total | | | X |

## Implementation Notes
- Framework: PyTorch X.X + HuggingFace Transformers X.X
- Key dependencies: [list]
- Critical decisions: [list non-obvious choices]

## Expected Results
Research hypothesis: [specific predicted improvement]
Confidence: [High / Medium / Low]
```

Update the idea in `idea_store` (action: `update`):
- Store the experimental plan in `methodology` field
- Update status to `in_progress`

## Quality Criteria

- At least 3 baselines (including the most recent SOTA)
- At least 3 ablations covering all claimed contributions
- Primary dataset must be the same as related work (for fair comparison)
- Compute estimate must be realistic (not "1 GPU, 1 hour")
- Implementation notes must mention the training framework and key libraries
