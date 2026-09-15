async (page) => {
  let submitted;
  // Run via playwright-cli run-code --filename scripts/check-evidence-ui.js.
  // Synthetic local notebook; every API request is intercepted before navigation.
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if(url.endsWith('/attempts')&&route.request().method()==='POST') {
      submitted=route.request().postDataJSON();
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...submitted,status:'graded',verdict:'incorrect',grades:[{verdict:'incorrect',feedback:'Synthetic feedback. Check the truth assignment.',at:Date.now()}]})});
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        url.includes('/auth/session')
          ? { email: 'synthetic@example.test', expires: Date.now() + 86400000 }
          : url.includes('/mutations')
            ? {
                ...route.request().postDataJSON(),
                revision: 1,
                versions: [],
                conflicts: [],
                updated: Date.now(),
              }
            : { records: [], attempts: [], cursor: 0, more: false },
      ),
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:5175/#/progress/propositional-logic');
  await page.reload();
  await page.getByRole('heading', { name: 'Progress', exact: true }).waitFor();
  await page.evaluate(async () => {
    const store = await import('/src/storage.ts');
    const { snapshot } = await import('/src/evidenceTypes.ts');
    await store.clearLocalWork();
    const catalog = await (await fetch('/learning-evidence.json')).json();
    const base = Date.UTC(2026, 8, 1, 12);
    let i = 0;
    for (const [id, verdict, assisted] of [
      [19, 'incorrect', false],
      [19, 'correct', true],
      [20, 'incorrect', false],
      [20, 'correct', true],
      [21, 'correct', false],
    ]) {
      i++;
      const a = {
        id: 'synthetic-' + i,
        exercise: 'propositional-logic-' + id,
        submitted: base + i * 60000,
        contentVersion: 'fixture',
        mode: 'type',
        text:
          verdict === 'correct'
            ? id===19 ? 'The antecedent is true and the consequent false, so the implication is false.' : 'The implication is true when its antecedent is false.'
            : 'I evaluated only the consequent.',
        images: [],
        revealed: false,
        status: 'graded',
        verdict,
        startedAt: base + (i - 1) * 60000,
        activeDurationMs: 23000,
        unsure: true,
        assistance: {
          answerPreviouslyRevealed: false,
          priorIncorrectFeedbackSeen: assisted,
          copiedFromRetry: assisted,
        },
        analytics: snapshot(catalog, 'propositional-logic-' + id),
        grades: [
          {
            at: base + i * 60000,
            verdict,
            model: 'synthetic fixture',
            feedback:
              verdict === 'correct'
                ? 'The truth assignment was evaluated using the implication rule.'
                : 'Check the antecedent as well as the consequent.',
            requirements: [
              {
                id: 'evaluation',
                description: 'Evaluate and show the intermediate truth values',
                satisfied: verdict === 'correct',
              },
            ],
            confidence: 'high',
            diagnosis:
              verdict === 'incorrect'
                ? [
                    {
                      class: 'conceptual',
                      severity: 'substantive',
                      tags: ['implication-false-antecedent'],
                      concepts: ['implication'],
                      skills: ['evaluate'],
                    },
                  ]
                : [],
          },
        ],
      };
      await store.put('attempts', a.id, a);
    }
  });
  await page.getByText('2 substantive-error attempts', { exact: false }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/desktop.png' });
  await page.getByRole('button', { name: 'Implication semantics', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Concept × skill coverage' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/concept.png' });
  await page.reload();
  await page.getByRole('heading', { name: 'Progress', exact: true }).waitFor();
  await page.setViewportSize({ width: 412, height: 900 });
  await page.locator('#reader').evaluate((e) => (e.scrollTop = 0));
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/phone.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
    throw Error('Page overflows phone width');
  await page.goto('http://127.0.0.1:5175/#/practice/propositional-logic/37');
  await page.getByRole('textbox', { name: 'Answer editor' }).fill('Synthetic answer');
  await page.getByRole('button', { name: 'Unsure', exact: true }).click();
  await page.getByRole('button', { name: 'Unsure ✓', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/uncertainty.png' });
  const draft = await page.evaluate(async () => {
    const s = await import('/src/storage.ts');
    return s.get('drafts', 'propositional-logic-37');
  });
  if (!draft.unsure || !draft.startedAt) throw Error('Effort/uncertainty was not captured');
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  await page.getByText('Incorrect',{exact:true}).waitFor();
  if(!submitted.unsure||!submitted.startedAt||submitted.activeDurationMs<0||!submitted.assistance||submitted.analytics)throw Error('Submission boundary did not preserve evidence or trusted server metadata');
  await page.getByRole('button',{name:'Show feedback',exact:true}).click();
  const seen=await page.evaluate(async()=>{const s=await import('/src/storage.ts');return s.get('drafts','propositional-logic-37');});
  if(!seen.assistance.priorIncorrectFeedbackSeen)throw Error('Feedback assistance not retained');
}
