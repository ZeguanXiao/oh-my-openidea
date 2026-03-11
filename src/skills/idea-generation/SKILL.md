````skill
---
name: idea-generation
description: Iterative Idea Generation loop — drives survey → knowledge synthesis → hypothesis generation → critique cycles with user feedback between iterations until a high-quality idea emerges.
---

# Idea Generation Skill (Stage 1)

This skill drives **Stage 1** of the research framework: an iterative loop that mirrors how human
researchers explore a new field — repeatedly surveying literature, updating their understanding,
proposing hypotheses, and revising direction based on feedback.

Each iteration builds on the previous: the knowledge base grows, the search becomes more targeted,
and the ideas become more grounded and novel.

## When to Use

Use this skill when:
- Starting a new research project to discover promising ideas
- A prior idea was rejected and you need a new direction
- You want to explore a topic iteratively before committing to experiments
- You want a project-local workspace to accumulate knowledge across sessions

## Prerequisites

- A research topic or broad research question
- An initialised project directory (the `.openidea/` workspace will be created here)

## Workflow

### Step 0: Initialise Workspace

1. Call `workspace` with action `get_state` to check if a workspace exists.
2. If none: call `workspace` with action `init` and the research topic.
3. If one exists: read all knowledge files (`workspace read_knowledge`) and the most recent
   iteration log to understand what has already been explored.
4. Check `idea_store` for any existing validated ideas from prior iterations.
5. **If resuming**: brief the user on the current state — iteration count, papers cached,
   knowledge base summary, and ideas found so far.

### Step 1: Survey (each iteration)

**Check workspace cache first:**
- Call `workspace list_papers` to retrieve the cached paper list.
- Pass the cached paper IDs to @surveyor so it can skip them.

**Launch 3 parallel @surveyor tasks:**
- Query 1: Primary topic query (broad sweep)
- Query 2: Targeted gap query (based on the most promising open problem in `gap-analysis.md`)
- Query 3: Survey/benchmark query ("survey X", "benchmark for Y", "systematic review of Z")

After @surveyor tasks complete:
- Call `workspace save_paper` for each newly found paper (title, ID, abstract, tags, notes).
- Papers already in the cache are skipped automatically.

### Step 2: Synthesize Knowledge (each iteration)

Launch **@synthesizer** with:
- The list of **newly found papers** from this iteration
- The **existing knowledge files** (pass paths: landscape.md, gap-analysis.md, key-methods.md, related-work.md)
- **User feedback** from the previous iteration (if any — pass verbatim)
- Iteration number (so @synthesizer can label updates)

@synthesizer will:
1. Read the existing knowledge files via `workspace read_knowledge`
2. Analyze the new papers
3. Write updated knowledge files via `workspace save_knowledge` (incremental, not full rewrites)

### Step 3: Generate Hypotheses (Orchestrator — self)

After @synthesizer returns:
1. Read all updated knowledge files (`workspace read_knowledge` for each)
2. Review the prior iteration logs to avoid repeating rejected directions
3. Generate **1–3 concrete hypotheses**, each:
   - Targeting a specific gap from the knowledge base (cite the knowledge file entry)
   - Different in methodology family from each other (no same-direction duplicates)
   - Different from ideas proposed in prior iterations
   - Including: problem statement, proposed approach (2–3 sentences), and why now (motivation)

### Step 4: Critique

Launch **@critic** for the top 1–2 hypotheses **in parallel**.

Pass to @critic:
- The hypothesis description
- Relevant knowledge base excerpts (especially gap-analysis.md + related-work.md)
- Summary of prior iteration ideas (to detect redundancy)

After @critic returns:
- Ideas with Overall ≥ 6: save to `idea_store` with `status: "validated"`, `critique_done: true`
- Ideas with Overall < 6: save to `idea_store` with `status: "abandoned"`, `critique_done: true`
- WEAK_REJECT ideas (5–6): save with `status: "draft"` — may improve next iteration

### Step 5: Save Iteration and Report to User

Call `workspace save_iteration` with the iteration summary:
```
## Survey focus
[Search queries used and rationale]

## New papers found (N)
- arXiv:XXXX Title — key contribution
...

## Knowledge updates
[What changed in landscape.md / gap-analysis.md / key-methods.md / related-work.md]

## Ideas proposed
1. [Title] — [one-sentence summary]
2. ...

## Critic verdicts
| Idea | Novelty | Feasibility | Overall | Verdict |
|------|---------|-------------|---------|---------|
| ...  | ...     | ...         | ...     | ...     |

## User feedback / direction for next iteration
[filled in after user responds]
```

**STOP and present to the user:**

```
## Iteration N complete

### What I learned this iteration
[2–3 bullet points summarising key knowledge updates]

### Ideas proposed

**1. [Title]** — Overall: X/10
- Problem: ...
- Approach: ...
- Key risk: ...
- Verdict: ACCEPT / WEAK_ACCEPT / WEAK_REJECT / REJECT

[repeat for each idea]

### All validated ideas so far (across all iterations)
| # | Title | Novelty | Feasibility | Overall |
|---|-------|---------|-------------|---------|
| 1 | ...   | ...     | ...         | ...     |

---
**What would you like to do?**
- **"next"** — run another iteration (searching deeper into the gaps)
- **Redirect** — e.g., "focus on efficiency", "explore graph-based approaches", "ignore RL"
- **"done"** / **"proceed"** — stop Idea Generation; I'll recommend the strongest idea and guide you to Stage 2
```

### Step 6: Process User Response

| Response | Action |
|----------|--------|
| "next" / "continue" | Increment iteration, loop to Step 1 (use gap-analysis.md for query direction) |
| Feedback / redirect | Incorporate into next survey queries and synthesis prompt; append feedback to next iteration summary; loop to Step 1 |
| "done" / "proceed" | Summarise all validated ideas; recommend the strongest; instruct: `Use the experiment-design skill on idea <ID>` |
| Idea name or ID | Show full details from `idea_store` |

**Iteration cap**: if `config.ideaGeneration.maxIterations` is reached (default: 5), notify user and
present the best idea found, recommending how to proceed to Stage 2.

## Output

At the end of a successful run, the workspace will contain:
```
.openidea/
├── config.json               # workspace metadata + iteration count
├── ideas.json                # validated (and rejected) ideas
├── literature/               # cached papers (avoid repeat fetching)
│   ├── arXiv_2301_12345.md
│   └── ...
├── knowledge/                # evolving knowledge base
│   ├── landscape.md          # field overview and taxonomy
│   ├── gap-analysis.md       # open problems and research gaps
│   ├── key-methods.md        # important techniques and baselines
│   └── related-work.md       # paper summaries and relationships
└── iterations/               # per-iteration logs
    ├── iteration-01.md
    └── ...
```

## Proceeding to Stage 2

When ready to design experiments on the selected idea:

```
Use the experiment-design skill on idea <ID>
```

Stage 2 reads the full workspace state (knowledge base + validated idea) automatically.

## Quality Criteria

- At least 1 full iteration must complete before a recommendation is made
- Each iteration must find at least 3 new papers not in the cache to be meaningful
- Hypotheses must cite specific gaps from the knowledge base (not invented from nothing)
- Every hypothesis must receive @critic evaluation before being marked validated
- The knowledge base must be updated every iteration (no stale synthesis)
- User feedback must be incorporated into the next iteration's search queries

````
