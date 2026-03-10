import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

const ALPHAXIV_BASE = 'https://alphaxiv.org';

/**
 * Parse an arXiv paper ID from various input formats.
 * Accepts bare IDs, arXiv URLs (abs/pdf), and alphaxiv URLs (overview/abs).
 * Preserves version suffix (e.g. v2) when present.
 */
function extractArxivId(input: string): string | null {
    const s = input.trim();
    // Bare ID: "2301.07041" or "2301.07041v2"
    if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(s)) return s;
    // "arxiv:2301.07041"
    const colonMatch = /^arxiv:(\d{4}\.\d{4,5}(?:v\d+)?)$/i.exec(s);
    if (colonMatch) return colonMatch[1];
    // arXiv URL: arxiv.org/abs/... or arxiv.org/pdf/...
    const arxivUrlMatch = /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i.exec(s);
    if (arxivUrlMatch) return arxivUrlMatch[1];
    // AlphaXiv URL: alphaxiv.org/overview/... or alphaxiv.org/abs/...
    const alphaUrlMatch = /alphaxiv\.org\/(?:overview|abs)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i.exec(s);
    if (alphaUrlMatch) return alphaUrlMatch[1];
    return null;
}

/**
 * Fetch an AI-generated structured overview of an arXiv paper from AlphaXiv.
 * Free public endpoint — no API key required.
 * Returns a machine-readable markdown report optimised for LLM consumption.
 */
export const alphaxiv_overview: ToolDefinition = tool({
    description: `Fetch an AI-generated structured overview of an arXiv paper from alphaxiv.org.
Returns a detailed, markdown-formatted report covering problem, method, results, and contributions.
Faster and more structured than reading a raw PDF. No API key required.
Use this as the primary way to understand a specific paper before deep-diving into the full text.`,

    args: {
        arxiv_id: z
            .string()
            .describe(
                'arXiv paper ID or URL in any format: bare ID ("2401.12345"), versioned ID ("2401.12345v2"), arXiv URL (arxiv.org/abs/...), or alphaxiv URL (alphaxiv.org/overview/...)',
            ),
    },

    async execute(args) {
        const raw = String(args.arxiv_id);
        const id = extractArxivId(raw);
        if (!id) {
            return `Cannot parse arXiv ID from: "${raw}". Expected formats: "2301.07041", "2301.07041v2", or a full arXiv/AlphaXiv URL.`;
        }

        const url = `${ALPHAXIV_BASE}/overview/${id}.md`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'oh-my-openidea/1.0 (research tool)' },
                signal: AbortSignal.timeout(30_000),
            });

            if (response.status === 404) {
                return (
                    `AlphaXiv overview not yet generated for arXiv:${id}.\n` +
                    `Try alphaxiv_full_text for the raw extracted text, or visit https://arxiv.org/abs/${id} for the abstract.`
                );
            }

            if (!response.ok) {
                return `AlphaXiv API error: HTTP ${response.status} ${response.statusText} for arXiv:${id}`;
            }

            const text = await response.text();
            if (!text || text.trim().length < 100) {
                return `AlphaXiv returned an empty overview for arXiv:${id}. The paper may not have been processed yet.`;
            }

            return `# AlphaXiv Overview: arXiv:${id}\nSource: ${url}\n\n${text}`;
        } catch (err) {
            return `AlphaXiv overview fetch failed for arXiv:${id}: ${err instanceof Error ? err.message : String(err)}`;
        }
    },
});

/**
 * Fetch the full extracted markdown text of an arXiv paper from AlphaXiv.
 * Free public endpoint — no API key required.
 * Use as a detailed fallback when alphaxiv_overview lacks a specific section or detail.
 */
export const alphaxiv_full_text: ToolDefinition = tool({
    description: `Fetch the full extracted markdown text of an arXiv paper from alphaxiv.org.
Returns the complete paper content as clean markdown (equations, tables, sections preserved).
Use as a fallback after alphaxiv_overview when you need a specific equation, table, or section not in the overview.
No API key required.`,

    args: {
        arxiv_id: z
            .string()
            .describe(
                'arXiv paper ID or URL in any format: bare ID ("2401.12345"), versioned ID ("2401.12345v2"), arXiv URL (arxiv.org/abs/...), or alphaxiv URL (alphaxiv.org/abs/...)',
            ),
        max_chars: z
            .number()
            .optional()
            .describe('Maximum characters to return from the full text (default: 20000). Use a smaller value to focus on the beginning of the paper.'),
    },

    async execute(args) {
        const raw = String(args.arxiv_id);
        const id = extractArxivId(raw);
        if (!id) {
            return `Cannot parse arXiv ID from: "${raw}". Expected formats: "2301.07041", "2301.07041v2", or a full arXiv/AlphaXiv URL.`;
        }

        const maxChars = typeof args.max_chars === 'number' ? args.max_chars : 20_000;
        const url = `${ALPHAXIV_BASE}/abs/${id}.md`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'oh-my-openidea/1.0 (research tool)' },
                signal: AbortSignal.timeout(45_000),
            });

            if (response.status === 404) {
                return (
                    `AlphaXiv full text not yet extracted for arXiv:${id}.\n` +
                    `As a last resort, the PDF is available at: https://arxiv.org/pdf/${id}`
                );
            }

            if (!response.ok) {
                return `AlphaXiv API error: HTTP ${response.status} ${response.statusText} for arXiv:${id}`;
            }

            const text = await response.text();
            if (!text || text.trim().length < 100) {
                return `AlphaXiv returned empty full text for arXiv:${id}. The paper may not have been processed yet.`;
            }

            const truncated = text.length > maxChars;
            const output = text.slice(0, maxChars);

            return (
                `# AlphaXiv Full Text: arXiv:${id}\nSource: ${url}\n` +
                (truncated ? `(Showing first ${maxChars.toLocaleString()} of ${text.length.toLocaleString()} characters)\n` : '') +
                `\n${output}`
            );
        } catch (err) {
            return `AlphaXiv full text fetch failed for arXiv:${id}: ${err instanceof Error ? err.message : String(err)}`;
        }
    },
});
