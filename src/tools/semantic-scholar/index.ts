import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

const SS_BASE = 'https://api.semanticscholar.org/graph/v1';

/**
 * Search Semantic Scholar for academic papers.
 * Returns papers with citation counts, influential citation flags, and AI-generated TLDRs.
 * Free API — no key required for basic access (rate limit: 100 req/5min).
 * Set SEMANTIC_SCHOLAR_API_KEY env var for higher limits.
 */
export const semantic_scholar_search: ToolDefinition = tool({
  description: `Search Semantic Scholar for academic papers with citation counts, influential citations, and TLDRs.
Ideal for finding highly-cited work, checking influence of specific papers, and tracing citation networks.`,

  args: {
    query: z
      .string()
      .describe('Search query (paper title keywords, concepts, or methods)'),
    year_range: z
      .tuple([z.number(), z.number()])
      .optional()
      .describe(
        'Year range filter as [start_year, end_year] (e.g. [2020, 2025])',
      ),
    fields_of_study: z
      .array(z.string())
      .optional()
      .describe(
        'Fields of study filter (e.g. ["Computer Science", "Mathematics"])',
      ),
    limit: z
      .number()
      .optional()
      .describe('Maximum number of results (default: 15, max: 100)'),
    min_citations: z
      .number()
      .optional()
      .describe(
        'Minimum citation count filter (useful for finding influential papers)',
      ),
  },

  async execute(args) {
    const query = String(args.query);
    const limit = Math.min(
      typeof args.limit === 'number' ? args.limit : 15,
      100,
    );

    const fields = [
      'paperId',
      'externalIds',
      'title',
      'abstract',
      'year',
      'authors',
      'citationCount',
      'influentialCitationCount',
      'fieldsOfStudy',
      'tldr',
      'openAccessPdf',
      'venue',
      'publicationDate',
    ].join(',');

    const params = new URLSearchParams({
      query,
      limit: String(limit),
      fields,
    });

    if (args.year_range) {
      const [start, end] = args.year_range as [number, number];
      params.set('year', `${start}-${end}`);
    }

    if (args.fields_of_study && (args.fields_of_study as string[]).length > 0) {
      params.set('fieldsOfStudy', (args.fields_of_study as string[]).join(','));
    }

    const url = `${SS_BASE}/paper/search?${params.toString()}`;
    const headers: Record<string, string> = {
      'User-Agent': 'oh-my-openidea/1.0 (research tool)',
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    let data: { data?: unknown[]; total?: number; error?: string };
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        const body = await response.text();
        return `Semantic Scholar API error: HTTP ${response.status} — ${body.slice(0, 200)}`;
      }
      data = (await response.json()) as typeof data;
    } catch (err) {
      return `Semantic Scholar API request failed: ${err instanceof Error ? err.message : String(err)}`;
    }

    if (!data.data || data.data.length === 0) {
      return `No results found on Semantic Scholar for query: "${query}"`;
    }

    // Apply min_citations filter client-side
    let papers = data.data as Record<string, unknown>[];
    if (typeof args.min_citations === 'number') {
      papers = papers.filter(
        (p) =>
          (p.citationCount as number | null) != null &&
          (p.citationCount as number) >= (args.min_citations as number),
      );
    }

    if (papers.length === 0) {
      return `No papers with ≥${args.min_citations} citations found for query: "${query}"`;
    }

    const lines: string[] = [
      `Semantic Scholar Results for: "${query}"`,
      `Found: ${papers.length} papers (total matches: ${data.total ?? '?'})`,
      '',
    ];

    for (const paper of papers) {
      const arxivId = (
        paper.externalIds as Record<string, string | undefined> | null
      )?.ArXiv;
      const id = arxivId ? `arXiv:${arxivId}` : `SS:${paper.paperId}`;
      const authors = (paper.authors as { name: string }[] | null) ?? [];
      const authorStr =
        authors
          .slice(0, 3)
          .map((a) => a.name)
          .join(', ') + (authors.length > 3 ? ` et al.` : '');
      const tldr = (paper.tldr as { text?: string } | null)?.text;
      const pdfUrl =
        (paper.openAccessPdf as { url?: string } | null)?.url ??
        (arxivId ? `https://arxiv.org/pdf/${arxivId}` : 'N/A');

      lines.push(
        `[${id}] ${paper.title}`,
        `  Authors: ${authorStr || 'Unknown'}`,
        `  Year: ${paper.year ?? '?'} | Venue: ${paper.venue || 'N/A'} | Citations: ${paper.citationCount ?? 0} (${paper.influentialCitationCount ?? 0} influential)`,
        `  Fields: ${(paper.fieldsOfStudy as string[] | null)?.join(', ') ?? 'N/A'}`,
        `  PDF: ${pdfUrl}`,
        tldr
          ? `  TLDR: ${tldr}`
          : `  Abstract: ${((paper.abstract as string | null) ?? '').slice(0, 250)}...`,
        '',
      );
    }

    return lines.join('\n');
  },
});

/**
 * Retrieve citation and reference graph for a paper via Semantic Scholar.
 */
export const citation_graph: ToolDefinition = tool({
  description: `Retrieve the citation graph (papers that cite this paper) or reference graph (papers this paper cites) for a given paper.
Provide a Semantic Scholar paper ID or arXiv ID to explore related work networks.`,

  args: {
    paper_id: z
      .string()
      .describe(
        'Semantic Scholar paper ID, arXiv ID (e.g. "2301.07041"), or arXiv URL',
      ),
    direction: z
      .enum(['citations', 'references', 'both'])
      .describe(
        'Direction to traverse: citations (who cites it), references (what it cites), or both',
      ),
    limit: z
      .number()
      .optional()
      .describe('Max papers to return per direction (default: 20)'),
    min_citations: z
      .number()
      .optional()
      .describe(
        'Minimum citation count for citations (filters out low-impact work)',
      ),
  },

  async execute(args) {
    const rawId = String(args.paper_id);
    const limit = Math.min(
      typeof args.limit === 'number' ? args.limit : 20,
      100,
    );

    // Normalize ID: strip URL prefix and arXiv version suffix
    const id = rawId
      .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, '')
      .replace(/v\d+$/, '')
      .trim();

    // Resolve to Semantic Scholar internal ID if arXiv ID
    const resolvedId = id.match(/^\d{4}\.\d{4,5}$/) ? `ArXiv:${id}` : id;

    const fields =
      'paperId,externalIds,title,year,authors,citationCount,influentialCitationCount,abstract';
    const headers: Record<string, string> = {
      'User-Agent': 'oh-my-openidea/1.0',
    };
    if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
      headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
    }

    const fetchDirection = async (dir: 'citations' | 'references') => {
      const url = `${SS_BASE}/paper/${encodeURIComponent(resolvedId)}/${dir}?limit=${limit}&fields=${fields}`;
      try {
        const resp = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(20_000),
        });
        if (!resp.ok) return null;
        const data = (await resp.json()) as { data?: unknown[] };
        return data.data ?? [];
      } catch {
        return null;
      }
    };

    const directions =
      args.direction === 'both'
        ? (['citations', 'references'] as const)
        : ([args.direction] as const);

    const results = await Promise.all(directions.map(fetchDirection));
    const lines: string[] = [`Citation Graph for: ${id}`, ''];

    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      const papers = results[i];
      lines.push(`## ${dir === 'citations' ? 'Cited By' : 'References'}`);

      if (!papers) {
        lines.push('(API error or paper not found)', '');
        continue;
      }

      let filtered = papers as Record<string, unknown>[];
      if (typeof args.min_citations === 'number' && dir === 'citations') {
        filtered = filtered.filter((p) => {
          const citing = (p as Record<string, unknown>).citingPaper as
            | Record<string, unknown>
            | undefined;
          return (
            ((citing?.citationCount as number | null) ?? 0) >=
            (args.min_citations as number)
          );
        });
      }

      if (filtered.length === 0) {
        lines.push('(no matching papers)', '');
        continue;
      }

      for (const entry of filtered) {
        const paper = (
          dir === 'citations'
            ? (entry as Record<string, unknown>).citingPaper
            : (entry as Record<string, unknown>).citedPaper
        ) as Record<string, unknown> | undefined;
        if (!paper) continue;

        const arxivId = (
          paper.externalIds as Record<string, string | undefined> | null
        )?.ArXiv;
        const idStr = arxivId ? `arXiv:${arxivId}` : `SS:${paper.paperId}`;
        const authors = (paper.authors as { name: string }[] | null) ?? [];
        const authorStr =
          authors
            .slice(0, 2)
            .map((a) => a.name)
            .join(', ') + (authors.length > 2 ? ' et al.' : '');

        lines.push(
          `[${idStr}] ${paper.title} (${paper.year ?? '?'}) | Citations: ${paper.citationCount ?? 0} | ${authorStr}`,
        );
      }
      lines.push('');
    }

    return lines.join('\n');
  },
});
