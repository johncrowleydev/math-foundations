import { validateAssessment, gradeAssessment } from '../../../shared/deterministic.ts';

export function assessment(question) {
  const c = question.check;
  if (!c) return undefined;
  const parts =
    c.parts ||
    (c.grid
      ? c.grid.values.flatMap((row, i) =>
          row.map((value, j) => ({
            id: `cell-${i}-${j}`,
            label: `${c.grid.rows[i]}, ${c.grid.columns[j]}`,
            check: {
              validator: 'exact',
              params: { expected: [value] },
              correct: value,
              incorrect: c.grid.wrongValues?.[i]?.[j] || `(${value})+1`,
            },
          })),
        )
      : [{ id: 'answer', label: 'Answer', check: c }]);
  const recognition = parts.every((p) => ['boolean', 'selection'].includes(p.check.validator));
  const scalarInputs = parts.map((p) => ({
    id: p.id,
    label: p.label,
    kind:
      p.check.validator === 'boolean' ? 'boolean' : p.check.validator === 'term' ? 'text' : 'math',
  }));
  const inputs = c.grid
    ? [
        {
          id: 'table',
          kind: 'grid',
          label: 'Table',
          columns: c.grid.columns,
          rows: c.grid.rows.map((label, i) => ({
            label,
            cells: c.grid.columns.map((_, j) => ({ id: `cell-${i}-${j}`, kind: 'text' })),
          })),
        },
      ]
    : scalarInputs;
  const a = {
    version: 1,
    inputs,
    requirements: parts.map((p) => ({
      id: p.id,
      description: p.label,
      validator: p.check.validator,
      fields: [p.id],
      params: p.check.params,
    })),
    feedback: { correct: question.answer, incorrect: question.answer },
    evidence: {
      level: recognition ? 'recognition' : 'production',
      interactionCost: 'low',
      inputCapabilities: [
        ...new Set(
          parts.map((p) =>
            p.check.validator === 'boolean' || p.check.validator === 'selection'
              ? 'tap'
              : p.check.validator === 'term'
                ? 'short-text'
                : 'math-text',
          ),
        ),
      ],
    },
  };
  validateAssessment(a);
  const correct = Object.fromEntries(parts.map((p) => [p.id, p.check.correct]));
  const fixtures = [{ response: correct, verdict: 'correct' }];
  for (const p of parts) {
    fixtures.push({ response: { ...correct, [p.id]: p.check.incorrect }, verdict: 'incorrect' });
    for (const value of p.check.extraValid || [])
      fixtures.push({ response: { ...correct, [p.id]: value }, verdict: 'correct' });
  }
  for (const f of fixtures) {
    let result;
    try {
      result = gradeAssessment(a, f.response);
    } catch (e) {
      throw Error(question.prompt + '\n' + JSON.stringify(f) + '\n' + e.message);
    }
    if (result.verdict !== f.verdict)
      throw Error('Authored answer fixture failed: ' + question.prompt + ' ' + JSON.stringify(f));
  }
  return { assessment: a, fixtures };
}
