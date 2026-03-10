import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

/**
 * Search arXiv preprints via the public arXiv API.
 * No API key required. Returns paper metadata including arXiv IDs,
 * titles, authors, abstracts, categories, and PDF links.
 */
export const arxiv_search: ToolDefinition = tool({
  description: `Search arXiv preprints by query, category, and date range.
Returns paper metadata: arXiv ID, title, authors, abstract snippet, categories, PDF URL.
Use for finding recent CS/ML research (default: last 3 years).`,

  args: {
    query: z.string().describe('Search query (keywords, concepts, or method names)'),
    categories: z
      .array(z.string())
      .optional()
      .describe(
        'arXiv category filters, e.g. ["cs.LG", "cs.CL", "cs.CV", "cs.AI", "stat.ML"]',
      ),
    max_results: z
      .number()
      .optional()
      .describe('Maximum number of results to return (default: 20, max: 100)'),
    date_from: z
      .string()
      .optional()
      .describe('Start date filter in YYYY-MM-DD format (e.g. "2022-01-01")'),
    date_to: z
      .string()
      .optional()
      .describe('End date filter in YYYY-MM-DD format (e.g. "2025-01-01")'),
    sort_by: z
      .enum(['relevance', 'lastUpdatedDate', 'submittedDate'])
      .optional()
      .describe('Sort order (default: relevance)'),
  },

  async execute(args) {
    const query = String(args.query);
    const maxResults = Math.min(
      typeof args.max_results === 'number' ? args.max_results : 20,
      100,
    );
    const sortBy = args.sort_by ?? 'relevance';

    // Build arXiv API query
    let searchQuery = `all:${encodeURIComponent(query)}`;

    // Add category filter
    if (args.categories && args.categories.length > 0) {
      const catFilter = (args.categories as string[])
        .map((c) => `cat:${c}`)
        .join('+OR+');
      searchQuery = `(${searchQuery})+AND+(${catFilter})`;
    }

    // Add date range filter (submittedDate format: YYYYMMDDHHMMSS)
    if (args.date_from || args.date_to) {
      const from = args.date_from
        ? (args.date_from as string).replace(/-/g, '') + '000000'
        : '000000000000';
      const to = args.date_to
        ? (args.date_to as string).replace(/-/g, '') + '235959'
        : '999999999999';
      searchQuery = `(${searchQuery})+AND+submittedDate:[${from}+TO+${to}]`;
    }

    const url =
      `https://export.arxiv.org/api/query?` +
      `search_query=${searchQuery}` +
      `&start=0` +
      `&max_results=${maxResults}` +
      `&sortBy=${sortBy}` +
      `&sortOrder=descending`;

    let xmlText: string;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'oh-my-openidea/1.0 (research tool)' },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) {
        return `arXiv API error: HTTP ${response.status} ${response.statusText}`;
      }
      xmlText = await response.text();
    } catch (err) {
      return `arXiv API request failed: ${err instanceof Error ? err.message : String(err)}`;
    }

    // Parse atom XML
    const entries = parseArxivXml(xmlText);

    if (entries.length === 0) {
      return `No results found on arXiv for query: "${query}"${args.categories ? ` in categories: ${(args.categories as string[]).join(', ')}` : ''}`;
    }

    const lines: string[] = [
      `arXiv Search Results for: "${query}"`,
      `Found: ${entries.length} papers`,
      '',
    ];

    for (const entry of entries) {
      lines.push(
        `[arXiv:${entry.id}] ${entry.title}`,
        `  Authors: ${entry.authors.slice(0, 4).join(', ')}${entry.authors.length > 4 ? ` et al. (${entry.authors.length} total)` : ''}`,
        `  Date: ${entry.published} | Categories: ${entry.categories.join(', ')}`,
        `  PDF: ${entry.pdf_url}`,
        `  Abstract: ${entry.abstract.slice(0, 300)}${entry.abstract.length > 300 ? '...' : ''}`,
        '',
      );
    }

    return lines.join('\n');
  },
});

interface ArxivEntry {
  id: string;
  title: string;
  authors: string[];
  published: string;
  abstract: string;
  categories: string[];
  pdf_url: string;
}

function parseArxivXml(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];

  // Split by entry tags
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];

    const idMatch = /<id>https?:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/i.exec(block);
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(block);
    const summaryMatch = /<summary>([\s\S]*?)<\/summary>/i.exec(block);
    const publishedMatch = /<published>([^<]+)<\/published>/i.exec(block);

    if (!idMatch || !titleMatch) continue;

    const id = idMatch[1].trim();
    const title = titleMatch[1].replace(/\s+/g, ' ').trim();
    const abstract = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, ' ').trim()
      : '';
    const published = publishedMatch
      ? publishedMatch[1].trim().slice(0, 10)
      : '';

    // Extract authors
    const authorNames: string[] = [];
    const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g;
    let authorMatch: RegExpExecArray | null;
    while ((authorMatch = authorRegex.exec(block)) !== null) {
      authorNames.push(authorMatch[1].trim());
    }

    // Extract categories
    const categories: string[] = [];
    const catRegex = /<category[^>]*term="([^"]+)"/g;
    let catMatch: RegExpExecArray | null;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1]);
    }

    entries.push({
      id,
      title,
      authors: authorNames,
      published,
      abstract,
      categories: categories.filter((c) => c.startsWith('cs.') || c.startsWith('stat.')),
      pdf_url: `https://arxiv.org/pdf/${id}`,
    });
  }

  return entries;
}
