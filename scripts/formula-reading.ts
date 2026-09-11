import katex from 'katex';

/** Authoring helper only. Ambiguous symbols require a context-specific authored reading. */
type Node = { type: string; [key: string]: any };
export type Readings = Record<string, string>;
const words: Readings = {
  '\\ldots': 'and so on',
  '\\@cdots': 'and so on',
  '+': 'plus',
  '-': 'minus',
  '=': 'equals',
  '<': 'is less than',
  '>': 'is greater than',
  '\\geq': 'is greater than or equal to',
  '\\leq': 'is less than or equal to',
  '≠': 'is not equal to',
  '\\ne': 'is not equal to',
  '\\neq': 'is not equal to',
  '\\neg': 'not',
  '\\land': 'and',
  '\\lor': 'or',
  '\\forall': 'for every',
  '\\exists': 'there exists',
  '\\in': 'is an element of',
  '\\notin': 'is not an element of',
  '\\subseteq': 'is a subset of',
  '\\subsetneq': 'is a proper subset of',
  '\\subset': 'is a proper subset of',
  '\\nsubseteq': 'is not a subset of',
  '\\cup': 'union',
  '\\cap': 'intersection',
  '\\setminus': 'set difference',
  '\\varnothing': 'the empty set',
  '\\triangle': 'symmetric difference',
  '\\cdot': 'times',
  '\\pm': 'plus or minus',
  '\\leftrightarrow': 'if and only if',
  '\\Longleftrightarrow': 'if and only if',
  '\\Longrightarrow': 'implies',
  '\\Rightarrow': 'implies',
  '\\therefore': 'therefore',
  '\\vdash': 'proves',
  '\\nmid': 'does not divide',
  '\\preceq': 'precedes or equals in the stated partial order',
  '\\mapsto': 'maps to',
  '\\rho': 'rho',
  '\\ell': 'ell',
  '\\varepsilon': 'epsilon',
  '\\infty': 'infinity',
  '\\star': 'star',
  '\\sum': 'the sum',
  '\\prod': 'the product',
  '\\bigcup': 'the union',
  '\\bigcap': 'the intersection',
  '\\log': 'log',
  '\\max': 'the maximum',
  '\\gcd': 'the greatest common divisor',
  '\\deg': 'the degree',
  '\\Omega': 'big Omega',
  '\\Theta': 'big Theta',
  '(': 'open parenthesis',
  ')': 'close parenthesis',
  '[': 'open bracket',
  ']': 'close bracket',
  '\\{': 'the set containing',
  '\\}': 'end set',
  '\\lfloor': 'floor of',
  '\\rfloor': 'end floor',
  '\\lceil': 'ceiling of',
  '\\rceil': 'end ceiling',
  ',': ',',
  ';': ';',
  ':': ':',
};
const ambiguous = new Set(['\\to', '\\equiv', '\\mid', '|', '\\times', '\\circ', '\\prec', '!']);
export function formulaReading(latex: string, context: Readings = {}) {
  const nodes = (katex as any).__parse(latex) as Node[];
  const unresolved = new Set<string>();
  let barOpen = false;
  function word(value: string): string {
    if (value === '|' && context[value] && context[value] !== 'restricted to') {
      barOpen = !barOpen;
      return barOpen ? context[value] + ' (' : ')';
    }
    if (context[value]) return context[value];
    if (ambiguous.has(value)) {
      unresolved.add(value);
      return `[${value}]`;
    }
    if (words[value]) return words[value];
    if (/^\\/.test(value)) {
      unresolved.add(value);
      return `[${value}]`;
    }
    return value;
  }
  const plain = (n: any): string =>
    Array.isArray(n) ? n.map(plain).join('') : (n?.text ?? (n?.body ? plain(n.body) : ''));
  function sequence(nodes: Node[]): string {
    const pieces: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.type === 'textord' && /^\d$/.test(n.text)) {
        let number = n.text;
        while (nodes[i + 1]?.type === 'textord' && /^\d$/.test(nodes[i + 1].text))
          number += nodes[++i].text;
        pieces.push(number);
      } else pieces.push(read(n));
    }
    return pieces
      .filter(Boolean)
      .join(' ')
      .replace(/\s+([,;])/g, '$1');
  }
  function read(n: Node | Node[]): string {
    if (Array.isArray(n)) return sequence(n);
    switch (n.type) {
      case 'mathord':
      case 'textord':
      case 'atom':
        return word(n.text);
      case 'ordgroup':
      case 'styling':
      case 'mclass':
      case 'lap':
        return read(n.body);
      case 'spacing':
      case 'kern':
      case 'mathchoice':
        return '';
      case 'text':
        return plain(n.body);
      case 'font': {
        const v = plain(n.body);
        if (n.font === 'mathbb')
          return (
            (
              {
                Z: 'the integers',
                R: 'the real numbers',
                N: context['\\mathbb N'] || 'the natural numbers',
                Q: 'the rational numbers',
              } as Readings
            )[v] || word('\\mathbb ' + v)
          );
        if (n.font === 'mathcal') return context['\\mathcal ' + v] || word('\\mathcal ' + v);
        if (n.font === 'mathrm') return v;
        return read(n.body);
      }
      case 'supsub': {
        if (
          n.base?.type === 'font' &&
          n.base.font === 'mathbb' &&
          plain(n.base.body) === 'N' &&
          plain(n.sub) === '0'
        )
          return 'the nonnegative integers';
        const base = read(n.base),
          sub = n.sub ? read(n.sub) : '',
          sup = n.sup ? read(n.sup) : '';
        if (
          n.base?.type === 'op' &&
          ['\\sum', '\\prod', '\\bigcup', '\\bigcap'].includes(n.base.name)
        )
          return base + (sub ? ' over ' + sub : '') + (sup ? ' through ' + sup : '') + ' of';
        if (n.base?.name === '\\log')
          return 'log' + (sub ? ' base ' + sub : '') + (sup ? ' raised to ' + sup : '') + ' of';
        if (n.sup && plain(n.sup) === '-1') {
          const key = 'inverse:' + plain(n.base);
          if (context[key]) return context[key] + (sub ? ' sub ' + sub : '');
          unresolved.add(key);
          return base + ' [inverse meaning required]';
        }
        if (n.sup && plain(n.sup) === 'c') {
          if (context['sup:c']) return base + ' complement';
          unresolved.add('sup:c');
        }
        return (
          base +
          (sub ? ' sub ' + sub : '') +
          (sup
            ? sup === '2'
              ? ' squared'
              : sup === '3'
                ? ' cubed'
                : ' raised to (' + sup + ')'
            : '')
        );
      }
      case 'sqrt':
        return (
          (n.index ? read(n.index) + 'th root of ' : 'the square root of ') +
          read(n.body) +
          '; end root'
        );
      case 'genfrac':
        return n.hasBarLine
          ? 'the fraction with numerator (' +
              read(n.numer) +
              ') and denominator (' +
              read(n.denom) +
              ')'
          : read(n.numer) + ' choose ' + read(n.denom);
      case 'op':
        return word(n.name);
      case 'operatorname':
        return word('operator:' + plain(n.body));
      case 'htmlmathml':
        return read(n.mathml);
      case 'array':
        return n.body.map((row: Node[]) => read(row)).join('; next line: ');
      case 'delimsizing':
        return word(n.delim);
      case 'leftright':
        return word(n.left) + ' ' + read(n.body) + ' ' + word(n.right);
      default:
        unresolved.add('node:' + n.type);
        return '[unread ' + n.type + ']';
    }
  }
  const reading = read(nodes).replace(/\s+/g, ' ').trim();
  const variables = new Set<string>();
  function vars(n: any) {
    if (!n) return;
    if (Array.isArray(n)) {
      n.forEach(vars);
      return;
    }
    if (['font', 'text', 'operatorname', 'op'].includes(n.type)) return;
    if (n.type === 'mathord') variables.add(n.text);
    for (const [k, v] of Object.entries(n)) if (k !== 'loc' && typeof v === 'object') vars(v);
  }
  vars(nodes);
  return { reading, unresolved: [...unresolved], variables: [...variables] };
}
