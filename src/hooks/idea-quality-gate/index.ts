/**
 * Idea Quality Gate hook — fires after idea_store save operations.
 * Nudges the orchestrator to run @critic validation when an idea
 * is saved without a critique already attached.
 *
 * Prevents ideas from progressing to experiment-design or paper-outline
 * before passing the novelty/feasibility quality check.
 */

const QUALITY_GATE_NUDGE = `\n\n---
Research Quality Gate: This idea has been saved without a @critic review.
Before proceeding to experiment design or paper writing:
1. Run the \`idea-critique\` skill (or delegate to @critic directly)
2. Update the idea's status to "validated" in idea_store after a passing review (Overall ≥ 6/10)
3. Save the iteration summary via \`workspace save_iteration\` before stopping
Skipping critique risks investing effort in ideas that overlap with existing work.`;

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

export function createIdeaQualityGateHook() {
  return {
    'tool.execute.after': async (
      input: ToolExecuteAfterInput,
      output: ToolExecuteAfterOutput,
    ): Promise<void> => {
      // Only trigger on idea_store tool calls
      if (input.tool !== 'idea_store') {
        return;
      }

      // Check if this was a save or update operation without critique_done
      const outputText = output.output ?? '';

      // If the tool output mentions the idea was saved without being critiqued, nudge
      if (
        outputText.includes('not been reviewed by @critic') ||
        (outputText.includes('Idea saved') && outputText.includes('⚠️'))
      ) {
        output.output = outputText + QUALITY_GATE_NUDGE;
      }
    },
  };
}
