---
name: alphaxiv-paper-lookup
description: Look up any arxiv paper on alphaxiv.org to get a structured AI-generated overview. This is faster and more reliable than trying to read a raw PDF.
---

# AlphaXiv Paper Lookup

Look up any arxiv paper on alphaxiv.org to get a structured AI-generated overview. This is faster and more reliable than trying to read a raw PDF.

## When to Use

- User shares an arxiv URL (e.g. `arxiv.org/abs/2401.12345`)
- User mentions a paper ID (e.g. `2401.12345`)
- User asks you to explain, summarize, or analyze a research paper
- User shares an alphaxiv URL (e.g. `alphaxiv.org/overview/2401.12345`)

## Workflow

### Step 1: Extract the paper ID

Parse the paper ID from whatever the user provides — all of the following formats are accepted by the tools:

| Input                                      | Paper ID       |
| ------------------------------------------ | -------------- |
| `https://arxiv.org/abs/2401.12345`         | `2401.12345`   |
| `https://arxiv.org/pdf/2401.12345`         | `2401.12345`   |
| `https://alphaxiv.org/overview/2401.12345` | `2401.12345`   |
| `2401.12345v2`                             | `2401.12345v2` |
| `2401.12345`                               | `2401.12345`   |

### Step 2: Fetch the AI-generated report (primary)

Call `alphaxiv_overview` with the paper ID or URL:

```
alphaxiv_overview(arxiv_id="2401.12345")
```

This returns a structured, detailed analysis of the paper optimised for LLM consumption — one call, plain markdown, no PDF parsing.

If the tool returns a "not yet generated" message (404), proceed to Step 3.

### Step 3: If you need more detail, fetch the full paper text (fallback)

If the overview doesn't contain the specific information the user is asking about (e.g. a particular equation, table, or section), call `alphaxiv_full_text`:

```
alphaxiv_full_text(arxiv_id="2401.12345")
```

This returns the full extracted text of the paper as markdown. Only use this as a fallback — the overview is usually sufficient.

You can pass `max_chars` to limit the response size if you only need a portion of the paper.

If this also returns a "not yet extracted" message (404), direct the user to the PDF at `https://arxiv.org/pdf/{PAPER_ID}`.

## Error Handling

- **"not yet generated" on Step 2**: Report not generated for this paper — proceed to Step 3.
- **"not yet extracted" on Step 3**: Full text not yet processed — fall back to PDF link.

## Notes

- No authentication required — these are public endpoints.
- Both tools handle ID parsing internally; pass the raw URL or ID as-is.
- Prefer `alphaxiv_overview` over `paper_reader` for structured understanding; use `paper_reader` for older papers that may not be indexed on AlphaXiv yet.
