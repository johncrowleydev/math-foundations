// Display only: convert the small expression notation used by authored answer
// fixtures into ordinary TeX. This never parses or grades learner submissions.
export function mathAnswerTex(expression) {
  const input = String(expression);
  const tokens = input.match(/(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z]+|[()+\-*/^]/g) || [];
  if (tokens.join('') !== input.replace(/\s/g, ''))
    throw Error(`Unsupported authored answer notation: ${input}`);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  function atom() {
    const token = take();
    if (token === '(') {
      const value = sum();
      if (take() !== ')') throw Error(`Unclosed authored answer: ${input}`);
      return value;
    }
    if (!token || !/^(?:\d|\.|[A-Za-z])/.test(token))
      throw Error(`Expected authored answer operand: ${input}`);
    if (/^[A-Za-z]+$/.test(token) && peek() === '(') {
      take();
      const argument = sum();
      if (take() !== ')') throw Error(`Unclosed authored answer function: ${input}`);
      return { kind: 'function', name: token, argument };
    }
    return { kind: 'atom', value: token };
  }
  function power() {
    const base = atom();
    return peek() === '^' ? (take(), { kind: '^', left: base, right: unary() }) : base;
  }
  function unary() {
    if (peek() === '+' || peek() === '-') {
      const sign = take();
      return { kind: 'unary', sign, value: unary() };
    }
    return power();
  }
  function product() {
    let value = unary();
    while (peek() === '*' || peek() === '/') value = { kind: take(), left: value, right: unary() };
    return value;
  }
  function sum() {
    let value = product();
    while (peek() === '+' || peek() === '-')
      value = { kind: take(), left: value, right: product() };
    return value;
  }
  const tree = sum();
  if (index !== tokens.length) throw Error(`Unexpected authored answer token: ${input}`);
  function tex(node, parent = 0) {
    if (node.kind === 'atom') return node.value === 'pi' ? '\\pi' : node.value;
    if (node.kind === 'function') {
      const value = tex(node.argument);
      if (node.name === 'sqrt') return `\\sqrt{${value}}`;
      if (node.name === 'abs') return `\\left|${value}\\right|`;
      if (node.name === 'exp') return `e^{${value}}`;
      const names = {
        sin: 'sin',
        cos: 'cos',
        tan: 'tan',
        sec: 'sec',
        csc: 'csc',
        cot: 'cot',
        asin: 'arcsin',
        acos: 'arccos',
        atan: 'arctan',
        ln: 'ln',
      };
      const name = names[node.name];
      if (!name) throw Error(`Unsupported authored function: ${node.name}`);
      return `\\${name}\\left(${value}\\right)`;
    }
    if (node.kind === '/') return `\\frac{${tex(node.left)}}{${tex(node.right)}}`;
    const precedence = { '+': 1, '-': 1, '*': 2, unary: 3, '^': 4 }[node.kind];
    let value;
    if (node.kind === 'unary') value = node.sign + tex(node.value, precedence);
    else if (node.kind === '^') value = `${tex(node.left, precedence)}^{${tex(node.right)}}`;
    else if (node.kind === '*')
      value = `${tex(node.left, precedence)}\\cdot ${tex(node.right, precedence)}`;
    else
      value = `${tex(node.left, precedence)}${node.kind}${tex(node.right, node.kind === '-' ? precedence + 1 : precedence)}`;
    return precedence < parent ? `\\left(${value}\\right)` : value;
  }
  return tex(tree);
}

export function answerStatement(check) {
  if (check.validator === 'boolean')
    return check.correct ? 'The answer is true.' : 'The answer is false.';
  if (check.validator === 'term') return `The answer is **${check.correct}**.`;
  const value =
    check.validator === 'tuple'
      ? `\\left(${check.params.expected.map(mathAnswerTex).join(',\\ ')}\\right)`
      : mathAnswerTex(check.correct);
  return `The answer is $${value}$.`;
}
