/**
 * Post-Read nudge — appends a delegation reminder after paper reading operations.
 * Catches the "read paper → generate idea without proper synthesis" anti-pattern.
 * Updated for the iterative Idea Generation stage: nudges toward workspace caching + @synthesizer.
 */

const NUDGE =
  '\n\n---\nResearch Workflow Reminder: After reading papers, save them to the workspace cache via `workspace save_paper`, then delegate to @synthesizer to incrementally update the knowledge base before generating hypotheses. If mentioning a specialist, launch it in this same turn. Remember to save validated ideas using idea_store.';

interface ToolExecuteAfterInput {
  tool: string;
  sessionID?: string;
  callID?: string;
}

interface ToolExecuteAfterOutput {
  title: string;
  output: string;
  metadata: Record<string, unknown>;
}

export function createPostReadNudgeHook() {
  return {
    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput,
    ): Promise<void> => {
      // Only nudge for Read tool
      if (input.tool !== 'Read' && input.tool !== 'read') {
        return;
      }

      // Append the nudge
      output.output = output.output + NUDGE;
    },
  };
}
