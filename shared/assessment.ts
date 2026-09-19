/** Versioned, data-only contract shared by authored content and the offline client. */
export type AnswerValue = string | boolean | string[] | null;
export type StructuredResponse = Record<string, AnswerValue>;
export type AnswerOption = { id: string; label: string };
export type AssessmentInput =
  | { id: string; kind: 'text' | 'math' | 'boolean'; label: string; hint?: string }
  | {
      id: string;
      kind: 'select' | 'multiselect';
      label: string;
      options: AnswerOption[];
      emptyLabel?: string;
    }
  | {
      id: string;
      kind: 'grid';
      label: string;
      columns: string[];
      rows: {
        label?: string;
        cells: (
          { given: string | boolean } | { id: string; kind: 'boolean' | 'text'; label?: string }
        )[];
      }[];
    }
  | { id: string; kind: 'interval'; label: string };
export type AssessmentRequirement = {
  id: string;
  description: string;
  evidenceLevel?: 'recognition' | 'production' | 'reasoning';
  validator: string;
  fields: string[];
  params: Record<string, unknown>;
};
export type Assessment = {
  version: 1;
  inputs: AssessmentInput[];
  requirements: AssessmentRequirement[];
  feedback: { correct: string; incorrect: string };
  evidence: {
    level: 'recognition' | 'production' | 'reasoning';
    interactionCost: 'low' | 'medium' | 'high';
    inputCapabilities: ('tap' | 'short-text' | 'math-text')[];
  };
};
export type AssessmentResult = {
  verdict: 'correct' | 'incorrect';
  feedback: string;
  requirements: { id: string; description: string; satisfied: boolean }[];
};
export type AnswerFixture = {
  response: StructuredResponse;
  verdict?: 'correct' | 'incorrect';
  error?: boolean;
};
export function assessmentFields(
  a: Assessment,
): { id: string; kind: string; label: string; options?: AnswerOption[] }[] {
  return a.inputs.flatMap((input) => {
    if (input.kind === 'grid')
      return input.rows.flatMap((row, r) =>
        row.cells.flatMap((cell, c) =>
          'given' in cell
            ? []
            : [
                {
                  id: cell.id,
                  kind: cell.kind,
                  label: cell.label || `${input.label}, ${row.label || r + 1}, ${input.columns[c]}`,
                },
              ],
        ),
      );
    if (input.kind === 'interval')
      return [
        { id: input.id + '.lower', kind: 'text', label: input.label + ' lower endpoint' },
        { id: input.id + '.upper', kind: 'text', label: input.label + ' upper endpoint' },
        {
          id: input.id + '.leftClosed',
          kind: 'boolean',
          label: input.label + ' includes lower endpoint',
        },
        {
          id: input.id + '.rightClosed',
          kind: 'boolean',
          label: input.label + ' includes upper endpoint',
        },
      ];
    return [input];
  });
}
