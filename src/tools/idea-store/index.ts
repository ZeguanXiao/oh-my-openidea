import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

// Default storage location: ~/.config/opencode/oh-my-openidea/ideas.json
function getIdeasFilePath(): string {
  const configDir =
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(configDir, 'opencode', 'oh-my-openidea', 'ideas.json');
}

interface IdeaRecord {
  id: string;
  title: string;
  problem: string;
  approach: string;
  field: string;
  tags: string[];
  status: 'draft' | 'validated' | 'in_progress' | 'published' | 'abandoned';
  scores?: {
    novelty?: number;
    feasibility?: number;
    significance?: number;
    overall?: number;
  };
  related_papers?: string[];
  methodology?: string;
  outline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  critique_done: boolean;
}

function loadIdeas(filePath: string): IdeaRecord[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIdeas(filePath: string, ideas: IdeaRecord[]): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(ideas, null, 2), 'utf-8');
}

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Persistent local store for research ideas.
 * Stores ideas with metadata (scores, status, related papers, methodology notes).
 * Ideas are persisted to ~/.config/opencode/oh-my-openidea/ideas.json.
 */
export const idea_store: ToolDefinition = tool({
  description: `Persistent storage for research ideas. Save, list, retrieve, update, and delete ideas with full metadata.
Use to preserve generated and validated ideas across sessions.`,

  args: {
    action: z
      .enum(['save', 'list', 'get', 'update', 'delete', 'stats'])
      .describe('Action to perform on the idea store'),
    id: z
      .string()
      .optional()
      .describe('Idea ID (required for get, update, delete)'),
    title: z.string().optional().describe('Idea title (for save/update)'),
    problem: z
      .string()
      .optional()
      .describe('One-sentence problem statement (for save/update)'),
    approach: z.string().optional().describe('Core proposed approach (for save/update)'),
    field: z
      .string()
      .optional()
      .describe('Research field/sub-field (for save/update, e.g. "NLP", "CV", "RL")'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Topic tags (for save/update, e.g. ["reasoning", "transformers", "efficiency"])'),
    status: z
      .enum(['draft', 'validated', 'in_progress', 'published', 'abandoned'])
      .optional()
      .describe('Idea status (for save/update)'),
    scores: z
      .object({
        novelty: z.number().min(1).max(10).optional(),
        feasibility: z.number().min(1).max(10).optional(),
        significance: z.number().min(1).max(10).optional(),
        overall: z.number().min(1).max(10).optional(),
      })
      .optional()
      .describe('Critic scores (for update, provided by @critic)'),
    related_papers: z
      .array(z.string())
      .optional()
      .describe('Related paper IDs (arXiv IDs or Semantic Scholar IDs)'),
    methodology: z
      .string()
      .optional()
      .describe('Experimental plan summary (for update, provided by @architect)'),
    outline: z
      .string()
      .optional()
      .describe('Paper outline (for update, provided by @writer)'),
    notes: z.string().optional().describe('Free-form notes (for save/update)'),
    critique_done: z
      .boolean()
      .optional()
      .describe('Whether @critic has reviewed this idea (for update)'),
    filter_status: z
      .enum(['draft', 'validated', 'in_progress', 'published', 'abandoned'])
      .optional()
      .describe('Filter list by status'),
    filter_field: z.string().optional().describe('Filter list by field'),
  },

  async execute(args) {
    const filePath = getIdeasFilePath();
    const ideas = loadIdeas(filePath);

    switch (args.action) {
      case 'save': {
        if (!args.title || !args.problem || !args.approach) {
          return 'Error: save action requires title, problem, and approach fields.';
        }
        const newIdea: IdeaRecord = {
          id: generateId(),
          title: String(args.title),
          problem: String(args.problem),
          approach: String(args.approach),
          field: String(args.field ?? 'Unspecified'),
          tags: (args.tags as string[]) ?? [],
          status: (args.status as IdeaRecord['status']) ?? 'draft',
          scores: args.scores as IdeaRecord['scores'] | undefined,
          related_papers: (args.related_papers as string[]) ?? [],
          methodology: args.methodology ? String(args.methodology) : undefined,
          outline: args.outline ? String(args.outline) : undefined,
          notes: args.notes ? String(args.notes) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          critique_done: args.critique_done ?? false,
        };
        ideas.push(newIdea);
        saveIdeas(filePath, ideas);
        return `Idea saved successfully.\nID: ${newIdea.id}\nTitle: ${newIdea.title}\nStatus: ${newIdea.status}\n${!newIdea.critique_done ? '\n⚠️  Note: This idea has not been reviewed by @critic yet. Consider running novelty validation before finalizing.' : ''}`;
      }

      case 'list': {
        let filtered = ideas;
        if (args.filter_status) {
          filtered = filtered.filter((i) => i.status === args.filter_status);
        }
        if (args.filter_field) {
          const fieldLower = String(args.filter_field).toLowerCase();
          filtered = filtered.filter((i) =>
            i.field.toLowerCase().includes(fieldLower),
          );
        }
        if (filtered.length === 0) {
          return `No ideas found${args.filter_status ? ` with status "${args.filter_status}"` : ''}${args.filter_field ? ` in field "${args.filter_field}"` : ''}.`;
        }
        const lines = [
          `Research Ideas (${filtered.length} total):`,
          '',
        ];
        for (const idea of filtered) {
          const scoreStr =
            idea.scores?.overall != null ? ` | Score: ${idea.scores.overall}/10` : '';
          const critiqueStr = idea.critique_done ? ' ✓' : ' ⚠️ (not critiqued)';
          lines.push(
            `[${idea.id}] ${idea.title}`,
            `  Field: ${idea.field} | Status: ${idea.status}${scoreStr}${critiqueStr}`,
            `  Problem: ${idea.problem.slice(0, 100)}${idea.problem.length > 100 ? '...' : ''}`,
            `  Created: ${idea.created_at.slice(0, 10)}`,
            '',
          );
        }
        return lines.join('\n');
      }

      case 'get': {
        if (!args.id) return 'Error: get action requires an id.';
        const idea = ideas.find((i) => i.id === String(args.id));
        if (!idea) return `Idea not found: ${args.id}`;
        return JSON.stringify(idea, null, 2);
      }

      case 'update': {
        if (!args.id) return 'Error: update action requires an id.';
        const idx = ideas.findIndex((i) => i.id === String(args.id));
        if (idx === -1) return `Idea not found: ${args.id}`;
        const existing = ideas[idx];
        const updated: IdeaRecord = {
          ...existing,
          ...(args.title != null && { title: String(args.title) }),
          ...(args.problem != null && { problem: String(args.problem) }),
          ...(args.approach != null && { approach: String(args.approach) }),
          ...(args.field != null && { field: String(args.field) }),
          ...(args.tags != null && { tags: args.tags as string[] }),
          ...(args.status != null && { status: args.status as IdeaRecord['status'] }),
          ...(args.scores != null && { scores: { ...existing.scores, ...(args.scores as Record<string, number>) } }),
          ...(args.related_papers != null && { related_papers: args.related_papers as string[] }),
          ...(args.methodology != null && { methodology: String(args.methodology) }),
          ...(args.outline != null && { outline: String(args.outline) }),
          ...(args.notes != null && { notes: String(args.notes) }),
          ...(args.critique_done != null && { critique_done: Boolean(args.critique_done) }),
          updated_at: new Date().toISOString(),
        };
        ideas[idx] = updated;
        saveIdeas(filePath, ideas);
        return `Idea updated: ${updated.title}\nStatus: ${updated.status}\n${updated.scores?.overall != null ? `Overall score: ${updated.scores.overall}/10` : ''}`;
      }

      case 'delete': {
        if (!args.id) return 'Error: delete action requires an id.';
        const idx = ideas.findIndex((i) => i.id === String(args.id));
        if (idx === -1) return `Idea not found: ${args.id}`;
        const removed = ideas.splice(idx, 1)[0];
        saveIdeas(filePath, ideas);
        return `Idea deleted: "${removed.title}" (${removed.id})`;
      }

      case 'stats': {
        const total = ideas.length;
        const byStatus: Record<string, number> = {};
        let critiqued = 0;
        let avgScore = 0;
        let scored = 0;
        for (const idea of ideas) {
          byStatus[idea.status] = (byStatus[idea.status] ?? 0) + 1;
          if (idea.critique_done) critiqued++;
          if (idea.scores?.overall != null) {
            avgScore += idea.scores.overall;
            scored++;
          }
        }
        const lines = [
          `Idea Store Statistics`,
          `Total ideas: ${total}`,
          `Critiqued: ${critiqued}/${total}`,
          scored > 0 ? `Average overall score: ${(avgScore / scored).toFixed(1)}/10` : '',
          '',
          'By Status:',
          ...Object.entries(byStatus).map(([s, n]) => `  ${s}: ${n}`),
        ].filter((l) => l !== '');
        return lines.join('\n');
      }

      default:
        return `Unknown action: ${args.action}`;
    }
  },
});
