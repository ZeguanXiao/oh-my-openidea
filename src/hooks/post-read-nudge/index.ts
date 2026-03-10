/**
 * Post-Read nudge — appends a delegation reminder after paper reading operations.
 * Catches the "read paper → generate idea without proper synthesis" anti-pattern.
 */

const NUDGE =
  '\n\n---\nResearch Workflow Reminder: After reading papers, consider delegating to @synthesizer for gap analysis before generating hypotheses. If mentioning a specialist, launch it in this same turn. Remember to save validated ideas using idea_store.';

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
