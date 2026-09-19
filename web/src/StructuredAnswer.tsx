import { useId, useState } from 'react';
import type { ClipboardEvent } from 'react';
import type {
  Assessment,
  AssessmentInput,
  AnswerValue,
  StructuredResponse,
} from '../../shared/assessment';
import type { Attempt, Syntax } from './types';
import { Rich } from './Rich';
import { TexEditor } from './TexEditor';
import { pasteGrid } from './structuredAnswer';

const valueText = (value: AnswerValue | undefined) =>
  value === true
    ? 'T'
    : value === false
      ? 'F'
      : value === null || value === undefined || value === ''
        ? '—'
        : Array.isArray(value)
          ? value.join(', ') || '∅'
          : value;

function BooleanCell({
  label,
  value,
  onChange,
  symbols = ['T', 'F'],
  blankSymbol = '—',
  announcements = symbols,
}: {
  label: string;
  value: AnswerValue | undefined;
  onChange: (value: boolean | null) => void;
  symbols?: [string, string];
  blankSymbol?: string;
  announcements?: [string, string];
}) {
  const state = typeof value === 'boolean' ? (value ? symbols[0] : symbols[1]) : 'blank';
  return (
    <button
      type="button"
      className={'boolean-cell' + (typeof value === 'boolean' ? ' answered' : '')}
      aria-label={`${label}: ${typeof value === 'boolean' ? announcements[value ? 0 : 1] : 'blank'}`}
      title="Tap to toggle. T/F sets a value; Delete clears."
      onClick={() => onChange(value !== true)}
      onKeyDown={(event) => {
        const key = event.key.toLowerCase();
        if (['t', 'f', 'delete', 'backspace'].includes(key)) {
          event.preventDefault();
          onChange(key === 't' ? true : key === 'f' ? false : null);
        }
      }}
    >
      {state === 'blank' ? <span className="blank-value">{blankSymbol}</span> : state}
    </button>
  );
}

function AnswerGrid({
  input,
  response,
  onChange,
}: {
  input: Extract<AssessmentInput, { kind: 'grid' }>;
  response: StructuredResponse;
  onChange?: (response: StructuredResponse) => void;
}) {
  const [error, setError] = useState('');
  const rowLabels = input.rows.some((row) => row.label);
  let givenColumns = 0;
  if (!rowLabels)
    while (
      givenColumns < input.columns.length &&
      input.rows.every(
        (row) =>
          'given' in row.cells[givenColumns] &&
          typeof (row.cells[givenColumns] as { given: unknown }).given === 'boolean',
      )
    )
      givenColumns++;
  const paste = (event: ClipboardEvent, row: number, column: number) => {
    const text = event.clipboardData.getData('text');
    if (!onChange || (!text.includes('\t') && !text.includes('\n'))) return;
    event.preventDefault();
    try {
      onChange(pasteGrid(input, response, row, column, text));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };
  return (
    <div className="answer-grid-wrap">
      <div className="answer-grid-scroll" role="region" aria-label={input.label} tabIndex={0}>
        <table className="answer-grid">
          <caption>
            <Rich text={input.label} />
          </caption>
          <thead>
            <tr>
              {rowLabels && (
                <th scope="col">
                  <span className="sr-only">Row</span>
                </th>
              )}
              {input.columns.map((column, c) => (
                <th
                  scope="col"
                  key={c}
                  className={c < givenColumns ? 'sticky-given' : undefined}
                  style={c < givenColumns ? { left: c * 54 } : undefined}
                >
                  <Rich text={column} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {input.rows.map((row, r) => (
              <tr key={r}>
                {rowLabels && (
                  <th scope="row">
                    <Rich text={row.label || String(r + 1)} />
                  </th>
                )}
                {row.cells.map((cell, c) => {
                  if ('given' in cell)
                    return (
                      <td
                        key={c}
                        className={'given-cell' + (c < givenColumns ? ' sticky-given' : '')}
                        style={c < givenColumns ? { left: c * 54 } : undefined}
                      >
                        <Rich text={valueText(cell.given)} />
                      </td>
                    );
                  const label =
                    cell.label ||
                    `${input.label}, ${row.label || 'row ' + (r + 1)}, ${input.columns[c]}`;
                  const value = response[cell.id];
                  return (
                    <td key={c} onPaste={(event) => paste(event, r, c)}>
                      {!onChange ? (
                        <Rich text={valueText(value)} />
                      ) : cell.kind === 'boolean' ? (
                        <BooleanCell
                          label={label}
                          value={value}
                          onChange={(value) => onChange({ ...response, [cell.id]: value })}
                        />
                      ) : (
                        <input
                          aria-label={label}
                          autoComplete="off"
                          spellCheck={false}
                          value={typeof value === 'string' ? value : ''}
                          onChange={(event) =>
                            onChange({ ...response, [cell.id]: event.target.value })
                          }
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Input({
  input,
  response,
  onChange,
  syntax,
  preview,
}: {
  input: AssessmentInput;
  response: StructuredResponse;
  onChange?: (response: StructuredResponse) => void;
  syntax: Syntax[];
  preview?: boolean;
}) {
  const uid = useId();
  const value = response[input.id];
  const change = (value: AnswerValue) => onChange?.({ ...response, [input.id]: value });
  if (input.kind === 'grid')
    return <AnswerGrid input={input} response={response} onChange={onChange} />;
  if (input.kind === 'interval') {
    const endpoint = (side: 'lower' | 'upper') => {
      const id = input.id + '.' + side;
      return onChange ? (
        <input
          aria-label={`${input.label} ${side} endpoint`}
          autoComplete="off"
          spellCheck={false}
          value={typeof response[id] === 'string' ? (response[id] as string) : ''}
          onChange={(event) => onChange({ ...response, [id]: event.target.value })}
        />
      ) : (
        <Rich text={valueText(response[id])} />
      );
    };
    const bracket = (side: 'leftClosed' | 'rightClosed') => {
      const id = input.id + '.' + side;
      const symbols: [string, string] = side === 'leftClosed' ? ['[', '('] : [']', ')'];
      return onChange ? (
        <BooleanCell
          label={`${input.label} ${side === 'leftClosed' ? 'lower' : 'upper'} endpoint boundary`}
          value={response[id]}
          symbols={symbols}
          blankSymbol={side === 'leftClosed' ? '[ / (' : '] / )'}
          announcements={['included', 'excluded']}
          onChange={(value) => onChange({ ...response, [id]: value })}
        />
      ) : (
        <span>{typeof response[id] === 'boolean' ? symbols[response[id] ? 0 : 1] : '?'}</span>
      );
    };
    return (
      <div className="assessment-field">
        <Rich text={input.label} />
        <div className="interval-input">
          {bracket('leftClosed')}
          {endpoint('lower')}
          <span>,</span>
          {endpoint('upper')}
          {bracket('rightClosed')}
        </div>
        {onChange && <p className="muted">Tap brackets to include or exclude each endpoint.</p>}
      </div>
    );
  }
  if (input.kind === 'select' || input.kind === 'multiselect') {
    const multiple = input.kind === 'multiselect';
    if (!onChange) {
      if (preview)
        return (
          <div className="assessment-field">
            <Rich text={input.label} />
            <ul>
              {input.options.map((option) => (
                <li key={option.id}>
                  <Rich text={option.label} />
                </li>
              ))}
            </ul>
          </div>
        );
      const ids = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
      return (
        <div className="assessment-field">
          <Rich text={input.label} />
          <div className="answer-selection">
            {value === undefined ? (
              <span>—</span>
            ) : ids.length ? (
              ids.map((id) => (
                <Rich
                  key={id}
                  text={input.options.find((option) => option.id === id)?.label || id}
                />
              ))
            ) : (
              <Rich text={input.emptyLabel || 'Empty set'} />
            )}
          </div>
        </div>
      );
    }
    return (
      <fieldset className="assessment-selection">
        <legend>
          <Rich text={input.label} />
        </legend>
        <div
          className="answer-options"
          role={multiple ? 'group' : 'radiogroup'}
          aria-label={input.label}
        >
          {input.options.map((option) => (
            <label className="answer-option" key={option.id}>
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={uid}
                checked={
                  multiple ? Array.isArray(value) && value.includes(option.id) : value === option.id
                }
                onChange={() =>
                  change(
                    multiple
                      ? Array.isArray(value) && value.includes(option.id)
                        ? value.filter((id) => id !== option.id)
                        : [...(Array.isArray(value) ? value : []), option.id]
                      : option.id,
                  )
                }
              />
              <Rich text={option.label.replace(/\[([^\]]+)\]\(ref:[^)]+\)/g, '$1')} />
            </label>
          ))}
          {multiple && (
            <label className="answer-option empty-selection">
              <input
                type="checkbox"
                checked={Array.isArray(value) && !value.length}
                onChange={(event) => change(event.target.checked ? [] : null)}
              />
              <span>{input.emptyLabel || 'None'}</span>
            </label>
          )}
        </div>
      </fieldset>
    );
  }
  if (!onChange)
    return (
      <div className="assessment-field">
        <Rich text={input.label} />
        <div className="answer-value">
          <Rich text={valueText(value)} />
        </div>
      </div>
    );
  if (input.kind === 'boolean')
    return (
      <div className="assessment-field boolean-field">
        <Rich text={input.label} />
        <BooleanCell label={input.label} value={value} onChange={change} />
      </div>
    );
  if (input.kind === 'math')
    return (
      <div className="assessment-field">
        <Rich text={input.label} />
        {input.hint && <Rich text={input.hint} />}
        <TexEditor
          label={input.label}
          value={typeof value === 'string' ? value : ''}
          onChange={change}
          syntax={syntax}
        />
      </div>
    );
  const hint = 'hint' in input ? input.hint : undefined;
  return (
    <div className="assessment-field">
      <label htmlFor={uid}>
        <Rich text={input.label} />
      </label>
      <input
        id={uid}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => change(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={hint ? uid + '-hint' : undefined}
      />
      {hint && (
        <div id={uid + '-hint'} className="muted">
          <Rich text={hint} />
        </div>
      )}
    </div>
  );
}

export function StructuredAnswer({
  assessment,
  response = {},
  onChange,
  syntax = [],
  preview,
}: {
  assessment: Assessment;
  response?: StructuredResponse;
  onChange?: (response: StructuredResponse) => void;
  syntax?: Syntax[];
  preview?: boolean;
}) {
  return (
    <div className={'structured-answer' + (!onChange ? ' readonly-answer' : '')}>
      {assessment.inputs.map((input) => (
        <Input
          key={input.id}
          input={input}
          response={response}
          onChange={onChange}
          syntax={syntax}
          preview={preview}
        />
      ))}
    </div>
  );
}

export function SubmittedStructuredAnswer({ attempt }: { attempt: Attempt }) {
  const assessment = attempt.presentation?.assessment || attempt.presentation?.question.assessment;
  return assessment ? (
    <StructuredAnswer assessment={assessment} response={attempt.response} />
  ) : (
    <dl className="structured-answer">
      {Object.entries(attempt.response || {}).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            <Rich text={valueText(value)} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
