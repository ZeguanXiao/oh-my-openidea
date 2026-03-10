import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

/**
 * Search Google Scholar via the SerpAPI service.
 * Requires SERPAPI_KEY environment variable.
 * Useful for finding survey papers, highly-cited classics, and
 * broad academic coverage not well indexed on arXiv/Semantic Scholar.
 */
export const google_scholar_search: ToolDefinition = tool({
  description: `Search Google Scholar for academic papers, surveys, and books.
Requires SERPAPI_KEY environment variable.
Best for: classic/highly-cited papers, surveys, broad coverage across disciplines.`,

  args: {
    query: z
      .string()
      .describe('Search query (keywords, concepts, paper titles)'),
    num_results: z
      .number()
      .optional()
      .describe('Number of results to return (default: 10, max: 20)'),
    year_from: z.number().optional().describe('Start year filter (e.g. 2020)'),
    year_to: z.number().optional().describe('End year filter (e.g. 2025)'),
    sort_by: z
      .enum(['relevance', 'date'])
      .optional()
      .describe('Sort by relevance (default) or date'),
  },

  async execute(args) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return `Google Scholar search is unavailable: SERPAPI_KEY environment variable is not set.
To enable, obtain an API key from https://serpapi.com and set SERPAPI_KEY in your environment.`;
    }

    const query = String(args.query);
    const numResults = Math.min(
      typeof args.num_results === 'number' ? args.num_results : 10,
      20,
    );

    const params = new URLSearchParams({
      engine: 'google_scholar',
      q: query,
      api_key: apiKey,
      num: String(numResults),
    });

    if (args.year_from) params.set('as_ylo', String(args.year_from));
    if (args.year_to) params.set('as_yhi', String(args.year_to));
    if (args.sort_by === 'date') params.set('scisbd', '1');

    const url = `https://serpapi.com/search?${params.toString()}`;

    let data: {
      organic_results?: Array<{
        title?: string;
        link?: string;
        snippet?: string;
        publication_info?: {
          summary?: string;
          authors?: Array<{ name: string }>;
        };
        inline_links?: {
          cited_by?: { total?: number };
          related_pages_link?: string;
        };
        resources?: Array<{ link?: string; file_format?: string }>;
      }>;
      error?: string;
    };

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        const body = await response.text();
        return `SerpAPI error: HTTP ${response.status} — ${body.slice(0, 200)}`;
      }
      data = await response.json();
    } catch (err) {
      return `Google Scholar search failed: ${err instanceof Error ? err.message : String(err)}`;
    }

    if (data.error) {
      return `SerpAPI error: ${data.error}`;
    }

    const results = data.organic_results ?? [];
    if (results.length === 0) {
      return `No Google Scholar results found for query: "${query}"`;
    }

    const lines: string[] = [
      `Google Scholar Results for: "${query}"`,
      `Found: ${results.length} papers`,
      '',
    ];

    for (const result of results) {
      const cited =
        result.inline_links?.cited_by?.total != null
          ? `Citations: ${result.inline_links.cited_by.total}`
          : '';
      const pdfLink = result.resources?.find(
        (r) => r.file_format === 'PDF',
      )?.link;

      lines.push(
        `${result.title ?? 'Untitled'}`,
        `  Info: ${result.publication_info?.summary ?? 'N/A'} ${cited}`,
        `  URL: ${result.link ?? 'N/A'}`,
        pdfLink ? `  PDF: ${pdfLink}` : '',
        `  Snippet: ${(result.snippet ?? '').slice(0, 250)}${(result.snippet ?? '').length > 250 ? '...' : ''}`,
        '',
      );
    }

    return lines.filter((l) => l !== '').join('\n');
  },
});
