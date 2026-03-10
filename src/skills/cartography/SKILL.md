---
name: cartography
description: Repository understanding and hierarchical codemap generation — maps project structure, generates codemap.md files, and tracks changes via .slim/cartography.json.
---

# Cartography Skill

This skill provides **repository understanding and hierarchical codemap generation** for projects managed by the orchestrator.

## When to Use

Use this skill when:
- Starting work on an unfamiliar codebase and need a high-level map
- Generating or updating `codemap.md` files after significant refactors
- Creating `.slim/cartography.json` for change tracking
- Answering questions about project structure and file organization

## Workflow

### Step 1: Explore Repository Structure
Traverse the repository tree and identify top-level modules, entry points, and key directories.

### Step 2: Generate Codemaps
For each significant directory, produce a `codemap.md` summarizing its purpose, key files, and their roles.

### Step 3: Update Tracking File
Write or update `.slim/cartography.json` with the current map, file hashes, and last-modified timestamps.

## Output

- `codemap.md` files in each mapped directory
- `.slim/cartography.json` with the full repository map
