````skill
---
name: alphaxiv-paper-lookup
description: Look up any arXiv paper on alphaxiv.org to get a structured AI-generated overview. Faster and more reliable than reading a raw PDF.
---

# AlphaXiv Paper Lookup

Fetch a structured AI-generated overview of any arXiv paper via alphaxiv.org. This is the preferred way to understand a specific paper — one call returns a detailed markdown report, no PDF parsing needed.

## When to Use

- User shares an arXiv URL (e.g. `arxiv.org/abs/2401.12345`)
- User mentions a paper ID (e.g. `2401.12345`)
- User asks you to explain, summarize, or analyze a research paper
- During literature review: read specific papers after discovering IDs via `semantic_scholar_search` or `google_scholar_search`

## Workflow

### Step 1: Extract the paper ID

All of the following input formats are accepted by the tools:

| Input                                      | Accepted as-is |
| ------------------------------------------ | -------------- |
| `https://arxiv.org/abs/2401.12345`         | ✓              |
| `https://arxiv.org/pdf/2401.12345`         | ✓              |
| `https://alphaxiv.org/overview/2401.12345` | ✓              |
| `2401.12345v2`                             | ✓              |
| `2401.12345`                               | ✓              |

### Step 2: Fetch the AI-generated overview (primary)

```
alphaxiv_overview(arxiv_id="2401.12345")
```

Returns a structured, detailed analysis covering problem, method, results, and contributions — optimised for LLM consumption.

If the tool returns a "not yet generated" message (404), proceed to Step 3.

### Step 3: Fetch full paper text (fallback)

If the overview is missing a specific section, equation, or table the user needs:

```
alphaxiv_full_text(arxiv_id="2401.12345")
```

Pass `max_chars` to limit response size when you only need a portion:

```
alphaxiv_full_text(arxiv_id="2401.12345", max_chars=5000)
```

If this also returns 404, direct the user to `https://arxiv.org/pdf/{PAPER_ID}` or use `paper_reader`.

## Error Handling

- **404 on Step 2**: Not yet generated — proceed to Step 3.
- **404 on Step 3**: Not yet extracted — fall back to `paper_reader` or the PDF link.

## Notes

- No authentication required — public endpoints.
- Prefer `alphaxiv_overview` over `paper_reader` for structured understanding.
- For papers not indexed on AlphaXiv (very old or very recent), use `paper_reader` instead.
````
