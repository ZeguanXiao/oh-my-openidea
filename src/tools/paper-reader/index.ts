import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

/**
 * Retrieve paper content from an arXiv ID or arXiv abstract URL.
 * Uses arXiv's HTML rendering endpoint (available for most papers since ~2023)
 * to extract structured text without requiring a PDF parser.
 * Falls back to fetching the abstract page for older papers.
 */
export const paper_reader: ToolDefinition = tool({
  description: `Read a research paper from an arXiv ID or abstract URL.
Extracts structured sections (abstract, introduction, conclusion, etc.).
Use for deep analysis of specific papers after finding them via search tools.`,

  args: {
    source: z
      .string()
      .describe(
        'arXiv paper ID (e.g. "2301.07041" or "2301.07041v2") or full arXiv URL (abs or pdf)',
      ),
    sections: z
      .array(z.string())
      .optional()
      .describe(
        'Sections to extract (e.g. ["abstract", "introduction", "conclusion"]). Omit to get full paper.',
      ),
    max_chars: z
      .number()
      .optional()
      .describe('Maximum characters to return per section (default: 3000)'),
  },

  async execute(args) {
    const source = String(args.source);
    const maxChars = typeof args.max_chars === 'number' ? args.max_chars : 3000;

    // Extract arXiv ID from various input formats
    const arxivId = extractArxivId(source);
    if (!arxivId) {
      return `Cannot parse arXiv ID from: "${source}". Expected formats: "2301.07041", "arxiv:2301.07041", or full arXiv URL.`;
    }

    // Try arXiv HTML endpoint first (structured text, available for modern papers)
    const htmlUrl = `https://arxiv.org/html/${arxivId}`;
    let content = await tryFetchHtml(htmlUrl, maxChars, args.sections as string[] | undefined);

    // Fall back to abstract page scraping
    if (!content) {
      const absUrl = `https://arxiv.org/abs/${arxivId}`;
      content = await tryFetchAbstract(absUrl, arxivId);
    }

    return content ?? `Could not retrieve paper ${arxivId}. The paper may not be available on arXiv or the ID may be incorrect.`;
  },
});

function extractArxivId(source: string): string | null {
  // Already a clean arXiv ID like "2301.07041" or "2301.07041v2"
  if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(source.trim())) {
    return source.trim().replace(/v\d+$/, '');
  }
  // "arxiv:2301.07041"
  const colonMatch = /^arxiv:(\d{4}\.\d{4,5})(v\d+)?$/i.exec(source.trim());
  if (colonMatch) return colonMatch[1];
  // arXiv URL patterns
  const urlMatch =
    /arxiv\.org\/(?:abs|pdf|html)\/(\d{4}\.\d{4,5})(v\d+)?/i.exec(source);
  if (urlMatch) return urlMatch[1];
  // Old-style arXiv IDs like "cs/0401022"
  const oldMatch = /^[a-z-]+\/\d{7}$/.exec(source.trim());
  if (oldMatch) return source.trim();
  return null;
}

async function tryFetchHtml(
  url: string,
  maxChars: number,
  requestedSections?: string[],
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'oh-my-openidea/1.0 (research tool)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Basic HTML → text cleanup
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{3,}/g, '\n\n')
      .trim();

    if (text.length < 500) return null; // Likely an error page

    if (!requestedSections || requestedSections.length === 0) {
      return text.slice(0, maxChars * 5);
    }

    // Extract requested sections by heuristic heading detection
    return extractSections(text, requestedSections, maxChars);
  } catch {
    return null;
  }
}

async function tryFetchAbstract(url: string, arxivId: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'oh-my-openidea/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Extract title
    const titleMatch = /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i.exec(html) ??
      /<meta[^>]*name="citation_title"[^>]*content="([^"]+)"/i.exec(html);
    const title = titleMatch
      ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : 'Unknown Title';

    // Extract abstract
    const abstractMatch =
      /<blockquote[^>]*class="[^"]*abstract[^"]*"[^>]*>([\s\S]*?)<\/blockquote>/i.exec(html) ??
      /<meta[^>]*name="citation_abstract"[^>]*content="([^"]+)"/i.exec(html);
    const abstract = abstractMatch
      ? abstractMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : 'Abstract not available.';

    // Extract authors
    const authorsMatch =
      /<meta[^>]*name="citation_author"[^>]*content="([^"]+)"/gi;
    const authors: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = authorsMatch.exec(html)) !== null) {
      authors.push(m[1]);
    }

    return [
      `Paper: ${arxivId}`,
      `Title: ${title}`,
      `Authors: ${authors.slice(0, 6).join(', ')}${authors.length > 6 ? ` et al.` : ''}`,
      `PDF: https://arxiv.org/pdf/${arxivId}`,
      '',
      'Abstract:',
      abstract,
      '',
      '(Full text not available — only abstract extracted from arXiv page.)',
      'Use the PDF URL above to read the full paper.',
    ].join('\n');
  } catch {
    return null;
  }
}

function extractSections(
  text: string,
  sections: string[],
  maxChars: number,
): string {
  const normalizedSections = sections.map((s) => s.toLowerCase().trim());
  const lines = text.split('\n');
  const results: string[] = [];

  for (const targetSection of normalizedSections) {
    // Find the section heading
    let startIdx = -1;
    let endIdx = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (
        line === targetSection ||
        line.startsWith(`${targetSection} `) ||
        line.match(new RegExp(`^\\d+\\.?\\s+${targetSection}\\b`, 'i'))
      ) {
        startIdx = i;
        break;
      }
    }

    if (startIdx === -1) {
      results.push(`[Section "${targetSection}" not found]`);
      continue;
    }

    // Find the next section heading
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 3 && line.length < 100 && /^[A-Z0-9]/.test(line) && !line.endsWith('.')) {
        endIdx = i;
        break;
      }
    }

    const sectionText = lines
      .slice(startIdx, endIdx)
      .join('\n')
      .trim()
      .slice(0, maxChars);

    results.push(`## ${targetSection.charAt(0).toUpperCase() + targetSection.slice(1)}\n${sectionText}`);
  }

  return results.join('\n\n');
}
