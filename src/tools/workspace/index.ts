import * as fs from 'node:fs';
import * as path from 'node:path';
import { type ToolDefinition, tool } from '@opencode-ai/plugin';

const z = tool.schema;

// -----------------------------------------------------------------
// Types
// -----------------------------------------------------------------

interface WorkspaceConfig {
  topic?: string;
  created_at: string;
  iteration_count: number;
  current_iteration: number;
}

// -----------------------------------------------------------------
// Filesystem helpers
// -----------------------------------------------------------------

function getSubDir(workspaceDir: string, sub: string): string {
  return path.join(workspaceDir, sub);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readConfig(workspaceDir: string): WorkspaceConfig {
  const configPath = path.join(workspaceDir, 'config.json');
  try {
    if (!fs.existsSync(configPath)) {
      return {
        created_at: new Date().toISOString(),
        iteration_count: 0,
        current_iteration: 0,
      };
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as WorkspaceConfig;
  } catch {
    return {
      created_at: new Date().toISOString(),
      iteration_count: 0,
      current_iteration: 0,
    };
  }
}

function writeConfig(workspaceDir: string, config: WorkspaceConfig): void {
  ensureDir(workspaceDir);
  fs.writeFileSync(
    path.join(workspaceDir, 'config.json'),
    JSON.stringify(config, null, 2),
    'utf-8',
  );
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

// -----------------------------------------------------------------
// Factory
// -----------------------------------------------------------------

/**
 * Create the workspace tool bound to a specific project directory.
 * The workspace lives at <projectDir>/.openidea/.
 */
export function createWorkspaceTool(projectDir: string): ToolDefinition {
  const workspaceDir = path.join(projectDir, '.openidea');

  return tool({
    description: `Manages the local research workspace at .openidea/ in the project directory.
Provides a persistent file-based store for the iterative Idea Generation stage:
- **literature cache**: papers retrieved during survey phases (avoids re-fetching)
- **knowledge base**: evolving Markdown files summarising the research domain
- **iteration log**: per-iteration summaries of survey focus, ideas, and user feedback
- **workspace state**: iteration counter, topic, and metadata

Use this tool to initialise a new workspace project, save and retrieve papers, update the
knowledge base after each synthesis pass, and record per-iteration progress.`,

    args: {
      action: z
        .enum([
          'init',
          'save_paper',
          'list_papers',
          'read_paper',
          'save_knowledge',
          'read_knowledge',
          'save_iteration',
          'get_state',
        ])
        .describe('Action to perform'),

      // --- init ---
      topic: z
        .string()
        .optional()
        .describe('Research topic (for init — sets the workspace topic)'),

      // --- save_paper ---
      paper_id: z
        .string()
        .optional()
        .describe(
          'Paper identifier, e.g. arXiv:2301.12345 or a DOI (for save_paper / read_paper)',
        ),
      paper_title: z
        .string()
        .optional()
        .describe('Paper title (for save_paper)'),
      paper_authors: z
        .string()
        .optional()
        .describe('Authors string, e.g. "Smith et al." (for save_paper)'),
      paper_year: z
        .string()
        .optional()
        .describe('Publication year (for save_paper)'),
      paper_abstract: z
        .string()
        .optional()
        .describe('Abstract text (for save_paper)'),
      paper_tags: z
        .array(z.string())
        .optional()
        .describe(
          'Tags / themes, e.g. ["reasoning","transformers"] (for save_paper)',
        ),
      paper_notes: z
        .string()
        .optional()
        .describe(
          'Analyst notes — relevance, key contributions, gaps noted (for save_paper)',
        ),

      // --- save_knowledge ---
      knowledge_topic: z
        .string()
        .optional()
        .describe(
          'Knowledge file name without extension, e.g. "landscape", "gap-analysis", ' +
            '"key-methods", "related-work" (for save_knowledge / read_knowledge)',
        ),
      knowledge_content: z
        .string()
        .optional()
        .describe('Full Markdown content to write (for save_knowledge)'),
      knowledge_append: z
        .boolean()
        .optional()
        .describe(
          'If true, append content to the existing file instead of overwriting ' +
            '(for save_knowledge, default false)',
        ),

      // --- save_iteration ---
      iteration_content: z
        .string()
        .optional()
        .describe(
          'Markdown summary of the iteration: survey focus, new papers, knowledge updates, ' +
            'ideas proposed, critic verdicts, user feedback (for save_iteration)',
        ),

      // --- read_paper ---
      // uses paper_id above
    },

    async execute(args) {
      switch (args.action) {
        // -------------------------------------------------------
        case 'init': {
          ensureDir(workspaceDir);
          ensureDir(getSubDir(workspaceDir, 'literature'));
          ensureDir(getSubDir(workspaceDir, 'knowledge'));
          ensureDir(getSubDir(workspaceDir, 'iterations'));

          const existing = readConfig(workspaceDir);
          const isNew = existing.iteration_count === 0 && !existing.topic;

          if (isNew) {
            writeConfig(workspaceDir, {
              topic: args.topic,
              created_at: new Date().toISOString(),
              iteration_count: 0,
              current_iteration: 0,
            });
            return (
              `Workspace initialised at ${workspaceDir}\n` +
              `Topic: ${args.topic ?? '(not set)'}\n` +
              `Subdirectories created: literature/, knowledge/, iterations/`
            );
          }

          // Resuming an existing workspace
          if (args.topic && !existing.topic) {
            existing.topic = args.topic;
            writeConfig(workspaceDir, existing);
          }
          const knowledgeFiles = fs.existsSync(
            getSubDir(workspaceDir, 'knowledge'),
          )
            ? fs
                .readdirSync(getSubDir(workspaceDir, 'knowledge'))
                .filter((f) => f.endsWith('.md'))
            : [];
          const paperCount = fs.existsSync(
            getSubDir(workspaceDir, 'literature'),
          )
            ? fs
                .readdirSync(getSubDir(workspaceDir, 'literature'))
                .filter((f) => f.endsWith('.md')).length
            : 0;
          return (
            `Resuming existing workspace at ${workspaceDir}\n` +
            `Topic: ${existing.topic ?? '(not set)'}\n` +
            `Iterations completed: ${existing.iteration_count}\n` +
            `Papers cached: ${paperCount}\n` +
            `Knowledge files: ${knowledgeFiles.join(', ') || '(none yet)'}`
          );
        }

        // -------------------------------------------------------
        case 'save_paper': {
          if (!args.paper_id) {
            return 'Error: paper_id is required for save_paper.';
          }
          const litDir = getSubDir(workspaceDir, 'literature');
          ensureDir(litDir);

          const fileId = sanitizeFileName(String(args.paper_id));
          const filePath = path.join(litDir, `${fileId}.md`);

          // Build Markdown content
          const lines: string[] = [
            `# ${args.paper_title ?? args.paper_id}`,
            '',
            `**ID**: ${args.paper_id}`,
          ];
          if (args.paper_authors)
            lines.push(`**Authors**: ${args.paper_authors}`);
          if (args.paper_year) lines.push(`**Year**: ${args.paper_year}`);
          if (args.paper_tags && args.paper_tags.length > 0)
            lines.push(`**Tags**: ${(args.paper_tags as string[]).join(', ')}`);
          lines.push('');
          if (args.paper_abstract) {
            lines.push('## Abstract', '', String(args.paper_abstract), '');
          }
          if (args.paper_notes) {
            lines.push('## Notes', '', String(args.paper_notes), '');
          }
          lines.push(`_Cached: ${new Date().toISOString()}_`);

          const alreadyExists = fs.existsSync(filePath);
          fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
          return alreadyExists
            ? `Paper updated: ${fileId}.md`
            : `Paper saved: ${fileId}.md`;
        }

        // -------------------------------------------------------
        case 'list_papers': {
          const litDir = getSubDir(workspaceDir, 'literature');
          if (!fs.existsSync(litDir)) {
            return 'Literature cache is empty (workspace not initialised or no papers saved yet).';
          }
          const files = fs.readdirSync(litDir).filter((f) => f.endsWith('.md'));
          if (files.length === 0) {
            return 'Literature cache is empty — no papers saved yet.';
          }

          const lines = [`Cached papers (${files.length} total):`, ''];
          for (const file of files) {
            const content = fs.readFileSync(path.join(litDir, file), 'utf-8');
            const firstLine =
              content.split('\n')[0]?.replace(/^#\s*/, '') ?? file;
            const idLine =
              content
                .split('\n')
                .find((l) => l.startsWith('**ID**'))
                ?.replace('**ID**: ', '') ?? '';
            const tagsLine =
              content
                .split('\n')
                .find((l) => l.startsWith('**Tags**'))
                ?.replace('**Tags**: ', '') ?? '';
            lines.push(
              `- **${firstLine}**`,
              idLine ? `  ID: ${idLine}` : '',
              tagsLine ? `  Tags: ${tagsLine}` : '',
              '',
            );
          }
          return lines.filter((l) => l !== null).join('\n');
        }

        // -------------------------------------------------------
        case 'read_paper': {
          if (!args.paper_id) {
            return 'Error: paper_id is required for read_paper.';
          }
          const litDir = getSubDir(workspaceDir, 'literature');
          const fileId = sanitizeFileName(String(args.paper_id));
          const filePath = path.join(litDir, `${fileId}.md`);
          if (!fs.existsSync(filePath)) {
            return `Paper not found in cache: ${fileId}. Use save_paper to cache it first, or search via AlphaXiv MCP.`;
          }
          return fs.readFileSync(filePath, 'utf-8');
        }

        // -------------------------------------------------------
        case 'save_knowledge': {
          if (!args.knowledge_topic) {
            return 'Error: knowledge_topic is required for save_knowledge (e.g. "landscape", "gap-analysis", "key-methods").';
          }
          if (!args.knowledge_content) {
            return 'Error: knowledge_content is required for save_knowledge.';
          }
          const knowledgeDir = getSubDir(workspaceDir, 'knowledge');
          ensureDir(knowledgeDir);

          const fileName = `${sanitizeFileName(String(args.knowledge_topic))}.md`;
          const filePath = path.join(knowledgeDir, fileName);
          const append = args.knowledge_append === true;

          if (append && fs.existsSync(filePath)) {
            const existing = fs.readFileSync(filePath, 'utf-8');
            fs.writeFileSync(
              filePath,
              `${existing}\n\n${args.knowledge_content}`,
              'utf-8',
            );
            return `Knowledge file updated (appended): ${fileName}`;
          }

          fs.writeFileSync(filePath, String(args.knowledge_content), 'utf-8');
          return `Knowledge file saved: ${fileName}`;
        }

        // -------------------------------------------------------
        case 'read_knowledge': {
          const knowledgeDir = getSubDir(workspaceDir, 'knowledge');
          if (!fs.existsSync(knowledgeDir)) {
            return 'Knowledge base is empty (no knowledge files saved yet).';
          }

          // If specific topic requested, return that file
          if (args.knowledge_topic) {
            const fileName = `${sanitizeFileName(String(args.knowledge_topic))}.md`;
            const filePath = path.join(knowledgeDir, fileName);
            if (!fs.existsSync(filePath)) {
              return `Knowledge file not found: ${fileName}. Available: ${fs.readdirSync(knowledgeDir).join(', ')}`;
            }
            return fs.readFileSync(filePath, 'utf-8');
          }

          // Otherwise list all knowledge files with a preview
          const files = fs
            .readdirSync(knowledgeDir)
            .filter((f) => f.endsWith('.md'));
          if (files.length === 0) {
            return 'Knowledge base is empty — no knowledge files saved yet.';
          }
          const lines = [`Knowledge base (${files.length} files):`, ''];
          for (const file of files) {
            const content = fs.readFileSync(
              path.join(knowledgeDir, file),
              'utf-8',
            );
            const preview = content
              .split('\n')
              .slice(0, 3)
              .join(' ')
              .slice(0, 120);
            lines.push(`**${file}**: ${preview}...`, '');
          }
          return lines.join('\n');
        }

        // -------------------------------------------------------
        case 'save_iteration': {
          if (!args.iteration_content) {
            return 'Error: iteration_content is required for save_iteration.';
          }
          const iterationsDir = getSubDir(workspaceDir, 'iterations');
          ensureDir(iterationsDir);

          const config = readConfig(workspaceDir);
          const nextN = config.iteration_count + 1;
          const fileName = `iteration-${String(nextN).padStart(2, '0')}.md`;
          const header = `# Iteration ${nextN}\n_${new Date().toISOString()}_\n\n`;

          fs.writeFileSync(
            path.join(iterationsDir, fileName),
            header + String(args.iteration_content),
            'utf-8',
          );

          config.iteration_count = nextN;
          config.current_iteration = nextN;
          writeConfig(workspaceDir, config);

          return `Iteration ${nextN} saved: ${fileName}\nTotal iterations: ${nextN}`;
        }

        // -------------------------------------------------------
        case 'get_state': {
          if (!fs.existsSync(workspaceDir)) {
            return (
              'Workspace not initialised. Call workspace with action "init" first.\n' +
              `Expected location: ${workspaceDir}`
            );
          }
          const config = readConfig(workspaceDir);

          const litDir = getSubDir(workspaceDir, 'literature');
          const paperCount = fs.existsSync(litDir)
            ? fs.readdirSync(litDir).filter((f) => f.endsWith('.md')).length
            : 0;

          const knowledgeDir = getSubDir(workspaceDir, 'knowledge');
          const knowledgeFiles = fs.existsSync(knowledgeDir)
            ? fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.md'))
            : [];

          const iterationsDir = getSubDir(workspaceDir, 'iterations');
          const iterationFiles = fs.existsSync(iterationsDir)
            ? fs.readdirSync(iterationsDir).filter((f) => f.endsWith('.md'))
            : [];

          return [
            `Workspace: ${workspaceDir}`,
            `Topic: ${config.topic ?? '(not set)'}`,
            `Created: ${config.created_at}`,
            `Iterations completed: ${config.iteration_count}`,
            `Papers cached: ${paperCount}`,
            `Knowledge files: ${knowledgeFiles.length > 0 ? knowledgeFiles.join(', ') : '(none)'}`,
            `Iteration logs: ${iterationFiles.length > 0 ? iterationFiles.join(', ') : '(none)'}`,
          ].join('\n');
        }

        default:
          return `Unknown action: ${String(args.action)}`;
      }
    },
  });
}
