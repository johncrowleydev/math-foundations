import {
  r,
  lesson,
  section,
  termEntry,
  citation,
  q,
  exact,
  approx,
  tuple,
  fields,
  truth,
  quick,
  frac,
} from './helpers.mjs';
const ols = citation(
  'regression-os-12-3',
  'openstax-statistics-2e',
  '§12.3 The Regression Equation',
  'https://openstax.org/books/introductory-statistics-2e/pages/12-3-the-regression-equation',
  'Least-squares slope and intercept, residuals, squared errors, residual plots, and restrictions on extrapolation; examples are original.',
);
const gaussian = citation(
  'regression-mml-9-1-2',
  'mml',
  '§§9.1–9.2, printed pp.291–295 / PDF pp.297–301',
  'https://mml-book.github.io/book/mml-book.pdf#page=297',
  'Independent Gaussian observation models and the equivalence between maximum likelihood and least squares for fixed common error variance.',
);
const inference = citation(
  'regression-islr-3-1',
  'islr',
  '§3.1.2, printed pp.65–68 / PDF pp.74–77',
  'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf#page=74',
  'Residual variance, coefficient standard errors, t tests and confidence intervals with n−2 degrees of freedom under the normal-error model.',
);
const prediction = citation(
  'regression-psu-3-2-3',
  'psu-stat501',
  'Lesson 3 §§3.2–3.3: mean-response confidence interval and new-response prediction interval',
  'https://online.stat.psu.edu/stat501/Lesson03',
  'Exact simple-linear-regression mean and prediction standard errors, t multipliers, and the extra variance of a future observation.',
);
const diagnostics = citation(
  'regression-islr-3-3',
  'islr',
  '§3.3.3 Potential Problems, printed pp.92–101 / PDF pp.101–110',
  'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf#page=101',
  'Nonlinearity, correlated errors, nonconstant variance, outliers and high leverage; numerical intervals rely on the specified model.',
);
const sections = [
  section(
    'A fitted line and a population model',
    r`Least squares in linear algebra chose coefficients to minimize a sum of squared residuals. Statistical regression asks a further question: how would the fitted coefficients vary if we collected another sample? Separate a population model from its fitted version. In simple linear regression,

$$Y_i=\beta_0+\beta_1x_i+\varepsilon_i,\qquad \widehat y_i=b_0+b_1x_i.$$

The predictor values $x_i$ are treated as fixed, or inference is conditional on their observed values. The response $Y_i$ is random. The coefficients $\beta_0,\beta_1$ describe the population mean; $b_0,b_1$ are estimates computed from data. Assume $E[\varepsilon_i\mid x_i]=0$, so $E[Y_i\mid x_i]=\beta_0+\beta_1x_i$. A positive slope describes an increase in this conditional mean, not an increase in every individual response.

Write $\bar x,\bar y$ for the sample means and define the centered sums

$$S_{xx}=\sum_i(x_i-\bar x)^2,\qquad S_{xy}=\sum_i(x_i-\bar x)(y_i-\bar y).$$

When $S_{xx}>0$, the least-squares coefficients are $b_1=S_{xy}/S_{xx}$ and $b_0=\bar y-b_1\bar x$. This last identity means the fitted line passes through $(\bar x,\bar y)$. If every predictor equals the same value, $S_{xx}=0$: the data cannot distinguish an intercept change from a slope change.

For the observations $(0,1),(1,2),(2,5)$, the means are $1$ and $8/3$. Here $S_{xx}=2$ and $S_{xy}=4$, giving $b_1=2$ and $b_0=2/3$. The fitted values are $2/3,8/3,14/3$, and the residuals $e_i=y_i-\widehat y_i$ are $1/3,-2/3,1/3$. Their sum is zero and their squared sum is $2/3$. Residuals are observable differences from an estimated line; the model errors $\varepsilon_i$ involve unknown population coefficients. Those two quantities play different roles in inference.

A useful check is units. If responses are measured in seconds and predictors in meters, the intercept and residuals use seconds, the slope uses seconds per meter, and SSE uses squared seconds. Changing measurement units changes numerical coefficients without changing the underlying fitted relationship. This is why a bare slope number needs its context.`,
    [ols, gaussian],
    [
      termEntry(
        'regression-residual',
        'Regression residual',
        'Observed response minus fitted response.',
        r`$e_i=y_i-(b_0+b_1x_i)$ measures a signed vertical discrepancy.`,
        r`If $y=8$ and $\widehat y=6$, the residual is $2$.`,
        'A residual is not the unobserved population error.',
      ),
      termEntry(
        'centered-predictor-sum',
        'Centered predictor sum of squares',
        r`$S_{xx}$ measures predictor spread.`,
        r`$S_{xx}=\sum_i(x_i-\bar x)^2$; a positive value is needed to identify a slope.`,
        r`For $x=0,1,2$, $S_{xx}=2$.`,
        'It is a sum, not the sample variance divided by the sample size.',
      ),
    ],
  ),
  section(
    'Why Gaussian likelihood gives least squares',
    r`To obtain an exact small-sample reference distribution, strengthen the model: the errors are independent normal variables with common variance $\sigma^2>0$ and mean zero. Then $Y_i\mid x_i$ is normal with mean $\beta_0+\beta_1x_i$ and variance $\sigma^2$. Normality concerns responses around their conditional means; the predictors themselves need not form a normal sample.

Independence multiplies the observation densities. For candidate coefficients $\beta=(\beta_0,\beta_1)$, define $\operatorname{SSE}(\beta)=\sum_i(y_i-\beta_0-\beta_1x_i)^2$. The likelihood and log-likelihood are

$$L(\beta,\sigma^2)=(2\pi\sigma^2)^{-n/2}\exp\!\left(-\frac{\operatorname{SSE}(\beta)}{2\sigma^2}\right),$$
$$\ell(\beta,\sigma^2)=-\frac n2\ln(2\pi\sigma^2)-\frac{\operatorname{SSE}(\beta)}{2\sigma^2}.$$

For a fixed common variance, the first log term does not depend on the coefficients. Maximizing likelihood therefore minimizes SSE. This explains a statistical assumption behind squared-error fitting. Equal variance gives equal weight to equal squared residuals. If observations have different known variances, their Gaussian contributions instead scale by their own variances; the unweighted objective no longer represents that likelihood. We retain the common-variance model throughout the computations here. It does not say every noise distribution produces the same objective. Also, a likelihood density is not the probability of the exact observed continuous data point.

Suppose candidate A has SSE $12$, candidate B has SSE $20$, and $\sigma^2=4$. Then $\ell(A)-\ell(B)=(20-12)/8=1$, so $L(A)/L(B)=e$. This comparison holds for the same observations and variance. Changing the variance also changes the normalizing term; minimizing only SSE divided by variance would then be wrong.

With variance unknown and a nonzero minimized SSE, maximum likelihood estimates it by $\widehat\sigma^2_{\mathrm{ML}}=\operatorname{SSE}/n$. The usual unbiased residual-variance estimate is instead $s^2=\operatorname{SSE}/(n-2)$ because two coefficients were fitted. For $n=8$ and SSE $18$, these are $9/4$ and $3$. Use $s$ for the t-based standard errors below. Perfect fit with SSE zero is a degenerate variance-estimation case, not evidence that future observations have no uncertainty.`,
    [gaussian, inference],
    [
      termEntry(
        'residual-standard-error',
        'Residual standard error',
        'An estimate of the common error standard deviation.',
        r`In simple regression with intercept and slope, $s=\sqrt{\operatorname{SSE}/(n-2)}$.`,
        r`With $n=8$ and SSE $18$, $s=\sqrt3$.`,
        'Dividing by n gives the Gaussian maximum-likelihood variance estimate instead.',
      ),
    ],
  ),
  section(
    'Uncertainty in a coefficient',
    r`A fitted slope alone does not show how precisely the population slope has been estimated. Under the independent normal-error model, with $n>2$ and $S_{xx}>0$, estimate its standard error by

$$\operatorname{SE}(b_1)=\frac{s}{\sqrt{S_{xx}}}.$$

More predictor spread helps separate slopes, while greater noise makes the estimate less precise. The standard error is measured in response units per predictor unit, just like the slope. It is not the standard deviation of the response observations. For completeness, the intercept standard error is $\operatorname{SE}(b_0)=s\sqrt{1/n+\bar x^2/S_{xx}}$. Centering the predictor at $\bar x$ makes the new intercept estimate the mean response at the center of the data.

To test $H_0:\beta_1=\beta_{1,0}$, compute

$$t=\frac{b_1-\beta_{1,0}}{\operatorname{SE}(b_1)}.$$

Under the null and the stated assumptions, this statistic has a Student t distribution with $n-2$ degrees of freedom. A two-sided test compares $|t|$ to the supplied critical value $t^*$. The matching confidence interval is $b_1\pm t^*\operatorname{SE}(b_1)$. The multiplier depends on confidence level and degrees of freedom; it is not always $1.96$.

For $n=10$, SSE $8$, $S_{xx}=25$, and $b_1=0.8$, we obtain $s=1$ and $\operatorname{SE}(b_1)=0.2$. Using the supplied 95% multiplier $t^*=2.306$, the interval is $0.8\pm0.4612$, or $[0.3388,1.2612]$. The null value zero gives $t=4$ and is rejected at the matching two-sided level. This is evidence of association under the model, not a probability that the null hypothesis is true or a proof of a useful effect.

Repeated samples produce different intervals. The confidence level describes their long-run coverage of the fixed population slope. A narrow interval can still be misleading when its sampling assumptions fail.

The same standardization works for a nonzero null slope. If an engineering claim specifies a slope of one, subtract one in the numerator; testing against zero would answer another question. A coefficient can be clearly different from zero while still being consistent with a specified practically meaningful value.`,
    [inference],
    [
      termEntry(
        'slope-standard-error',
        'Slope standard error',
        'Estimated sampling spread of the fitted slope.',
        r`$\operatorname{SE}(b_1)=s/\sqrt{S_{xx}}$ under the common-variance model.`,
        r`With $s=2$ and $S_{xx}=100$, it is $1/5$.`,
        'It is not the slope, residual variance, or standard deviation of the predictors.',
      ),
    ],
  ),
  section(
    'Predicting a mean and predicting one new observation',
    r`Fix a predictor value $x_0$ within a region where the model is defensible. The fitted mean is $\widehat y_0=b_0+b_1x_0$. Two questions now have the same point estimate but different uncertainty: what is the population mean response at $x_0$, and what response will one new independent observation have there?

Define $h_0=1/n+(x_0-\bar x)^2/S_{xx}$. The estimated standard error for the fitted mean is $s\sqrt{h_0}$. The standard error for predicting a new response is $s\sqrt{1+h_0}$. Therefore the corresponding intervals, using the same supplied t multiplier with $n-2$ degrees of freedom, are

$$\widehat y_0\pm t^*s\sqrt{h_0}\quad\text{and}\quad\widehat y_0\pm t^*s\sqrt{1+h_0}.$$

The extra one represents a new observation's own error variance. That error is independent of the fitted mean under our model, so variances add. Even perfect knowledge of the population mean would not eliminate individual variation. The formulas assume the new observation follows the same error model; a future measurement from a different process requires a different analysis.

Suppose $n=10$, $\bar x=0$, $S_{xx}=20$, $s=2$, and the fitted mean at $x_0=0$ is $5$. Here $h_0=1/10$. With $t^*=2.306$, the mean-response interval is approximately $[3.5416,6.4584]$. The new-response interval is approximately $[0.1629,9.8371]$. Both intervals are centered at five, but their widths answer different questions.

Moving $x_0$ away from $\bar x$ increases $h_0$, so both intervals widen even before questioning extrapolation. At the center, collecting more suitable observations can make mean uncertainty small; the individual-response uncertainty still includes $s$. A computed interval outside the observed predictor range is not protected against model misspecification merely because its formula produces endpoints. Always name the target quantity when reporting an interval.`,
    [prediction],
    [
      termEntry(
        'prediction-interval',
        'Prediction interval',
        'An interval for a future individual response.',
        r`For a new response at $x_0$, use $\widehat y_0\pm t^*s\sqrt{1+1/n+(x_0-\bar x)^2/S_{xx}}$.`,
        r`Its squared standard error exceeds that for the mean by $s^2$.`,
        'A confidence interval for the mean response omits individual noise and is narrower when s is positive.',
      ),
    ],
  ),
  section(
    'Assumptions, diagnostics, and the limits of a slope',
    r`The preceding intervals are consequences of a model, so interpreting them requires checking more than arithmetic. The mean response must be linear in the predictor over the relevant range. Errors must have mean zero conditional on the predictor, common variance, and the independence required by the sampling design. Normal errors give the exact t-based small-sample results. None of these assumptions says the predictor must itself be random or normally distributed.

Plot residuals against fitted values or predictors. A U-shaped pattern suggests a missing nonlinear mean structure. A widening fan suggests nonconstant variance. Runs of similar residual signs in time order suggest dependence. A single plot cannot prove the model correct, and mechanically deleting an unusual observation can conceal an important process or measurement problem.

A point with an extreme predictor value has high leverage: it can strongly affect the fitted line. A point can have high leverage and a small residual because it helped pull the line toward itself. Investigate its provenance and compare scientifically defensible analyses. More data collected under the same systematic error do not automatically repair bias.

For a least-squares line with an intercept, define $\operatorname{SST}=\sum_i(y_i-\bar y)^2$ and, when SST is positive, $R^2=1-\operatorname{SSE}/\operatorname{SST}$. If SST is $80$ and SSE is $20$, then $R^2=3/4$: the fitted line accounts for three quarters of the sample's squared variation around its mean. This is a descriptive fitting quantity, not evidence that the predictor causes the response or that prediction on new data will be accurate.

For example, a positive association between study time and assessment scores may involve prior preparation and course selection. A causal claim needs a defensible design and assumptions beyond a regression coefficient. Also distinguish statistical from practical importance: an extremely precise slope of $0.001$ may be too small to matter in the application. Report units, uncertainty, design, and the range of supported prediction together.`,
    [ols, diagnostics],
    [
      termEntry(
        'regression-leverage',
        'Leverage',
        'Potential influence associated with unusual predictor values.',
        r`Predictor values far from $\bar x$ can give an observation substantial influence on the fitted line.`,
        r`One point far to the right can rotate a fitted line while retaining a small residual.`,
        'High leverage and a large residual are different properties.',
      ),
    ],
  ),
];
// Centered summaries, raw data, prediction and residuals exercise distinct operations.
for (const [xb, yb, xx, xy] of [
  [2, 7, 10, 15],
  [0, 3, 8, -4],
  [-1, 4, 6, 12],
]) {
  const b = frac(xy, xx),
    a = frac(yb * xx - xy * xb, xx);
  sections[0].questions.push(
    q(
      r`Given $\bar x=${xb}$, $\bar y=${yb}$, $S_{xx}=${xx}$, and $S_{xy}=${xy}$, give $(b_0,b_1)$.`,
      r`Divide the centered cross-product by predictor spread: $b_1=${b}$. Then $b_0=${yb}-(${b})(${xb})=${a}$.`,
      tuple([a, b]),
    ),
  );
}
sections[0].questions.push(
  q(
    r`For $(x,y)=(0,2),(1,3),(2,4)$, give $(S_{xx},S_{xy})$.`,
    r`Both means are $1,3$ respectively. Centered predictor differences are $-1,0,1$ and centered responses are $-1,0,1$, so both sums equal $2$.`,
    tuple([2, 2]),
  ),
  q(
    r`The fitted line is $\widehat y=3-2x$. Give its prediction and the residual for $(x,y)=(4,-3)$.`,
    r`The prediction is $3-8=-5$, and the residual is $-3-(-5)=2$.`,
    tuple([-5, 2]),
  ),
  q(
    r`For the line $\widehat y=1+x/2$, give the prediction at $x=6$.`,
    r`Substitution gives $1+6/2=4$.`,
    exact(4),
  ),
  q(r`Residuals are $1,-2,1$. Compute SSE.`, r`Square before adding: $1+4+1=6$.`, exact(6)),
  q(
    r`A fitted slope is $-3$ kilograms per hour. What predicted mean change corresponds to an increase of $2$ hours?`,
    r`Multiply slope by predictor change: $-3(2)=-6$ kilograms.`,
    exact(-6),
  ),
  q(
    'Does a simple least-squares line with an intercept and nonconstant predictor pass through the sample means?',
    r`Yes. The identity $b_0=\bar y-b_1\bar x$ gives $b_0+b_1\bar x=\bar y$.`,
    truth(true),
  ),
  q(
    'All five predictor values equal 4. Explain why the data cannot identify separate intercept and slope values.',
    'Only the combination β₀+4β₁ affects fitted responses. Increasing the intercept by 4 and decreasing the slope by 1 leaves all predictions unchanged.',
  ),
  q(
    'Explain the difference between a model error and an observed residual.',
    'A model error subtracts the unknown population mean from a response. A residual subtracts the fitted sample line, which depends on all observations.',
  ),
);
for (const [n, sse] of [
  [6, 8],
  [10, 32],
  [12, 50],
])
  sections[1].questions.push(
    q(
      r`A normal-error line fit has $n=${n}$ and minimized SSE $${sse}$. Give the maximum-likelihood variance estimate and the unbiased residual-variance estimate, in that order.`,
      r`The likelihood estimate divides by $n$; the unbiased estimate allows for two fitted coefficients. Thus the values are $${frac(sse, n)}$ and $${frac(sse, n - 2)}$.`,
      tuple([frac(sse, n), frac(sse, n - 2)]),
    ),
  );
for (const [a, b, v] of [
  [8, 20, 3],
  [15, 9, 2],
  [12, 12, 5],
])
  sections[1].questions.push(
    q(
      r`On the same observations, candidates A and B have SSE $${a}$ and $${b}$. With common fixed variance $${v}$, compute $\ell(A)-\ell(B)$.`,
      r`The normalizing terms cancel. The difference is $(\operatorname{SSE}_B-\operatorname{SSE}_A)/(2\sigma^2)=(${b}-${a})/${2 * v}=${frac(b - a, 2 * v)}$.`,
      exact(frac(b - a, 2 * v)),
    ),
  );
sections[1].questions.push(
  q(
    r`A line fit uses $n=18$ independent observations. How many residual degrees of freedom enter its variance estimate?`,
    r`Two coefficients were fitted, so $18-2=16$.`,
    exact(16),
  ),
  q(
    r`At a candidate line, SSE is $24$ and fixed $\sigma^2=3$. Compute the coefficient-dependent negative log-likelihood term $\operatorname{SSE}/(2\sigma^2)$.`,
    r`The term is $24/6=4$. The omitted normalizing term is constant only when variance is fixed.`,
    exact(4),
  ),
  q(
    'Must the observed predictor values have a normal distribution for the conditional Gaussian-error model?',
    r`No. Normality is imposed on the errors, conditional on the predictors.`,
    truth(false),
  ),
  q(
    'Why cannot one maximize likelihood over unknown variance by minimizing SSE divided by variance alone?',
    'The log normalizing term also depends on variance. Omitting it rewards making variance indefinitely large and changes the optimization problem.',
  ),
  q(
    'Does zero training SSE prove that the population error variance is zero?',
    'No. A finite sample can fit perfectly by chance or excessive flexibility. The usual positive-variance likelihood estimate is degenerate at zero SSE, and future-data uncertainty is not established by that fit.',
    truth(false),
  ),
);
for (const [s, xx, b, nullv] of [
  [2, 100, 1, 0],
  [3, 36, -2, -1],
  [1, 25, 0.8, 0],
]) {
  const se = frac(s, Math.sqrt(xx)),
    t = frac(Math.round((b - nullv) * 10) * Math.sqrt(xx), 10 * s);
  sections[2].questions.push(
    q(
      r`Given residual standard error $s=${s}$ and $S_{xx}=${xx}$, compute $\operatorname{SE}(b_1)$.`,
      r`Use $s/\sqrt{S_{xx}}=${s}/${Math.sqrt(xx)}=${se}$.`,
      exact(se),
    ),
    q(
      r`A fit has $b_1=${b}$ and $\operatorname{SE}(b_1)=${se}$. Compute the statistic for $H_0:\beta_1=${nullv}$.`,
      r`Subtract the null slope before standardizing: $t=(${b}-${nullv})/(${se})=${t}$.`,
      exact(t),
    ),
  );
}
sections[2].questions.push(
  q(
    r`The fitted slope is $1.2$, its SE is $0.3$, and the supplied 95% t multiplier is $2.228$. Give both confidence endpoints to four decimal places.`,
    r`The margin is $2.228(0.3)=0.6684$. The endpoints are $0.5316$ and $1.8684$.`,
    fields([
      { id: 'lower', label: 'Lower endpoint', check: approx('.5316') },
      { id: 'upper', label: 'Upper endpoint', check: approx('1.8684') },
    ]),
  ),
  q(
    r`At a stated two-sided level, the critical value is $2.4$ and the observed statistic is $-2.7$. Should the null be rejected?`,
    r`Yes. Two-sided rejection compares absolute magnitude: $2.7>2.4$.`,
    truth(true),
  ),
  q(
    r`With fixed $s$, multiplying $S_{xx}$ by nine multiplies the slope SE by what factor?`,
    r`The denominator is a square root, so SE is multiplied by $1/3$.`,
    exact('1/3'),
  ),
  q(
    r`A centered-predictor fit has $\bar x=0$, $n=16$, and $s=4$. Compute the intercept SE.`,
    r`The formula reduces to $s/\sqrt n=4/4=1$.`,
    exact(1),
  ),
  q(
    'A 95% slope interval is [0.1,0.3]. Explain what the 95% refers to.',
    'It is the long-run coverage of intervals made by this procedure under its assumptions. It is not a 95% probability that this fixed population slope lies in this already observed interval.',
  ),
);
for (const [n, xx, dx, s] of [
  [4, 8, 0, 2],
  [8, 16, 2, 2],
  [10, 20, 0, 1],
]) {
  const h = frac(xx + n * dx * dx, n * xx),
    v = frac(s * s * (xx + n * dx * dx), n * xx),
    pv = frac(s * s * (n * xx + xx + n * dx * dx), n * xx);
  sections[3].questions.push(
    q(
      r`Use $n=${n}$, $S_{xx}=${xx}$, and $x_0-\bar x=${dx}$. Compute $h_0$.`,
      r`The leverage factor is $1/${n}+${dx * dx}/${xx}=${h}$.`,
      exact(h),
    ),
    q(
      r`At a prediction point, $h_0=${h}$ and $s=${s}$. Give the squared SE for the fitted mean and the squared SE for a new response.`,
      r`They are $s^2h_0=${v}$ and $s^2(1+h_0)=${pv}$. The second adds the individual error variance.`,
      tuple([v, pv]),
    ),
  );
}
sections[3].questions.push(
  q(
    r`The fitted mean is $8$, its SE is $0.5$, and the supplied t multiplier is $2.2$. Give the mean-response interval endpoints.`,
    r`The margin is $2.2(0.5)=1.1$, so the endpoints are $6.9,9.1$.`,
    tuple(['6.9', '9.1']),
  ),
  q(
    r`The fitted value is $8$, the new-response SE is $1.5$, and the supplied t multiplier is $2.2$. Give the prediction interval endpoints.`,
    r`The margin is $2.2(1.5)=3.3$, so the endpoints are $4.7,11.3$.`,
    tuple(['4.7', '11.3']),
  ),
  q(
    r`If residual standard error is $3$, by how much does the new-response squared SE exceed the fitted-mean squared SE at the same predictor?`,
    r`The extra variance is $s^2=9$.`,
    exact(9),
  ),
  q(
    'At the same point and confidence level, with positive residual variance, can the individual prediction interval be narrower than the mean-response interval?',
    r`No. Its variance adds $s^2>0$, so its margin is larger.`,
    truth(false),
  ),
  q(
    'Why does a very precise estimated mean not guarantee a very precise individual prediction?',
    'A new response has its own random error. Estimation uncertainty may shrink with sample size while the individual error variance remains positive.',
  ),
);
for (const [sse, sst] of [
  [12, 48],
  [18, 60],
  [30, 30],
])
  sections[4].questions.push(
    q(
      r`An intercept-containing least-squares fit has SSE $${sse}$ and SST $${sst}$. Compute $R^2$.`,
      r`Use $1-\operatorname{SSE}/\operatorname{SST}=1-${sse}/${sst}=${frac(sst - sse, sst)}$.`,
      exact(frac(sst - sse, sst)),
    ),
  );
sections[4].questions.push(
  q(
    r`A slope is $2$ response units per meter. Express it per centimeter.`,
    r`One centimeter is $1/100$ meter, so the slope is $2/100=1/50$ response units per centimeter.`,
    exact('1/50'),
  ),
  q(
    r`A slope estimate is $0.002$ response units per minute. What predicted mean change occurs over $30$ minutes?`,
    r`The fitted change is $0.002(30)=0.06$ response units. Compare this magnitude with what matters in context.`,
    exact('.06'),
  ),
  q(
    'Does a high R² by itself establish that a predictor causes a response?',
    'No. A fitted association can reflect confounding, selection, or a shared cause.',
    truth(false),
  ),
  q(
    'Can a high-leverage observation have a small residual?',
    'Yes. It can pull the fitted line close to itself while substantially changing the line.',
    truth(true),
  ),
  q(
    'A residual plot has a clear U shape. Which part of a straight-line model should be reconsidered, and why?',
    'The conditional mean specification should be reconsidered: a curved residual pattern suggests systematic structure remains after subtracting the fitted line.',
  ),
  q(
    'Residual spread grows steadily with fitted values. Explain the threat to the ordinary slope interval.',
    'The constant-variance assumption is doubtful, so the usual common-variance SE and resulting interval need not have their stated coverage.',
  ),
  q(
    'A time series has long runs of positive residuals followed by long runs of negative residuals. Explain why increasing the number of recorded times alone does not validate independent-error inference.',
    'Nearby errors may be correlated. More records do not remove dependence; the sampling model and uncertainty calculation must address it.',
  ),
  q(
    'A study reports a statistically significant slope from a convenience sample. Name two reasons to limit its interpretation.',
    'Convenience sampling may not represent the target population, and observational association need not be causal. The effect may also be too small for practical importance.',
  ),
);
sections[0].review.push(
  q(
    r`For $\bar x=3$, $\bar y=8$, $S_{xx}=4$, and $S_{xy}=12$, give the fitted intercept.`,
    r`The slope is $12/4=3$, so the intercept is $8-3(3)=-1$.`,
    exact(-1),
  ),
  q(
    r`Observed $y=11$ and fitted $\widehat y=13$. What is the residual?`,
    r`Observed minus fitted is $11-13=-2$.`,
    exact(-2),
  ),
  q(
    'Does a population slope describe every individual response change exactly?',
    'No. It describes conditional-mean change under the model, while individual responses include errors.',
    truth(false),
  ),
);
sections[1].review.push(
  q(
    r`A simple regression fit has $n=7$ and SSE $20$. Compute the unbiased residual variance.`,
    r`There are $7-2=5$ residual degrees of freedom, so $s^2=20/5=4$.`,
    exact(4),
  ),
  q(
    r`With fixed $\sigma^2=2$, SSE decreases by $10$. How much does log-likelihood increase?`,
    r`The increase is $10/(2\cdot2)=5/2$.`,
    exact('5/2'),
  ),
  q(
    'Is a Gaussian likelihood value the probability of one exact continuous response vector?',
    'No. It is a density evaluated at the observed vector; a continuous point has probability zero.',
    truth(false),
  ),
);
sections[2].review.push(
  q(r`Given $s=5$ and $S_{xx}=400$, compute slope SE.`, r`It is $5/20=1/4$.`, exact('1/4')),
  q(
    r`For $b_1=-0.4$, SE $0.2$, and null slope $0$, compute t.`,
    r`Standardizing gives $-0.4/0.2=-2$.`,
    exact(-2),
  ),
  q(
    r`A slope estimate is $3$, SE is $1/4$, and a supplied multiplier is $2$. Give the interval endpoints.`,
    r`The margin is $1/2$, giving $[5/2,7/2]$.`,
    tuple(['5/2', '7/2']),
  ),
);
sections[3].review.push(
  q(
    r`At $x_0=\bar x$ with $n=25$, compute $h_0$.`,
    r`The displacement term vanishes, leaving $1/25$.`,
    exact('1/25'),
  ),
  q(r`For $s=2$, $h_0=1/4$, compute the mean-response SE.`, r`It is $2\sqrt{1/4}=1$.`, exact(1)),
  q(
    'Which uncertainty term distinguishes a new-response prediction interval from a mean-response confidence interval?',
    'The variance of a new individual error is added to the variance of the fitted mean. This creates the extra one inside the square root.',
  ),
);
sections[4].review.push(
  q(
    r`SSE is $7$ and SST is $28$. Compute the fit's $R^2$.`,
    r`The unexplained fraction is $1/4$, leaving $R^2=3/4$.`,
    exact('3/4'),
  ),
  q(
    'Does normal-error inference require normally distributed predictors?',
    'No. It concerns the conditional distribution of the errors around the regression mean.',
    truth(false),
  ),
  q(
    'A fitted line is used far outside the observed predictor range. Explain one limitation that the usual numerical interval does not address.',
    'The conditional mean may cease to be linear there. The interval formula accounts for parameter and observation uncertainty within the assumed model, not unknown changes in that model.',
  ),
);
sections[1].quickCheck = quick(
  'For independent Gaussian errors of a fixed common variance, maximizing coefficient likelihood is equivalent to which operation?',
  [
    'Minimizing the sum of squared residuals',
    'Minimizing the sum of signed residuals',
    'Maximizing the error variance',
  ],
  0,
  'The coefficient-dependent log-likelihood term is negative SSE divided by a fixed positive number.',
  [
    'Correct: decreasing SSE increases log-likelihood.',
    'Signed residuals can cancel; their sum is not the Gaussian loss.',
    'The question fixes the variance, and the normalizing term also matters when variance varies.',
  ],
);
sections[3].quickCheck = quick(
  'At the same predictor and confidence level, which interval includes uncertainty from a new individual error?',
  [
    'The mean-response confidence interval only',
    'The new-response prediction interval',
    'Neither interval',
  ],
  1,
  'The new-response variance includes the additional error variance.',
  [
    'The mean interval concerns the population average, not an individual error.',
    'Correct: a prediction interval adds individual-response variation.',
    'The prediction interval explicitly includes new observation noise.',
  ],
);
export default lesson(
  21,
  'regression-interpretation',
  'Regression and Statistical Interpretation',
  'Connect least-squares fitting to a probability model, quantify coefficient uncertainty, and distinguish a mean-response estimate from an individual prediction. Read this after likelihood, confidence intervals, and hypothesis tests.',
  sections,
);
