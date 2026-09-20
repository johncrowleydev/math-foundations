# Regression and Statistical Interpretation

Connect least-squares fitting to a probability model, quantify coefficient uncertainty, and distinguish a mean-response estimate from an individual prediction. Read this after likelihood, confidence intervals, and hypothesis tests.

## A fitted line and a population model

Least squares in linear algebra chose coefficients to minimize a sum of squared residuals. Statistical regression asks a further question: how would the fitted coefficients vary if we collected another sample? Separate a population model from its fitted version. In simple linear regression,

$$Y_i=\beta_0+\beta_1x_i+\varepsilon_i,\qquad \widehat y_i=b_0+b_1x_i.$$

The predictor values $x_i$ are treated as fixed, or inference is conditional on their observed values. The response $Y_i$ is random. The coefficients $\beta_0,\beta_1$ describe the population mean; $b_0,b_1$ are estimates computed from data. Assume $E[\varepsilon_i\mid x_i]=0$, so $E[Y_i\mid x_i]=\beta_0+\beta_1x_i$. A positive slope describes an increase in this conditional mean, not an increase in every individual response.

Write $\bar x,\bar y$ for the sample means and define the centered sums

$$S_{xx}=\sum_i(x_i-\bar x)^2,\qquad S_{xy}=\sum_i(x_i-\bar x)(y_i-\bar y).$$

When $S_{xx}>0$, the least-squares coefficients are $b_1=S_{xy}/S_{xx}$ and $b_0=\bar y-b_1\bar x$. This last identity means the fitted line passes through $(\bar x,\bar y)$. If every predictor equals the same value, $S_{xx}=0$: the data cannot distinguish an intercept change from a slope change.

For the observations $(0,1),(1,2),(2,5)$, the means are $1$ and $8/3$. Here $S_{xx}=2$ and $S_{xy}=4$, giving $b_1=2$ and $b_0=2/3$. The fitted values are $2/3,8/3,14/3$, and the residuals $e_i=y_i-\widehat y_i$ are $1/3,-2/3,1/3$. Their sum is zero and their squared sum is $2/3$. Residuals are observable differences from an estimated line; the model errors $\varepsilon_i$ involve unknown population coefficients. Those two quantities play different roles in inference.

A useful check is units. If responses are measured in seconds and predictors in meters, the intercept and residuals use seconds, the slope uses seconds per meter, and SSE uses squared seconds. Changing measurement units changes numerical coefficients without changing the underlying fitted relationship. This is why a bare slope number needs its context.

Related definitions: [Regression residual](ref:probability-statistics-regression-residual); [Centered predictor sum of squares](ref:probability-statistics-centered-predictor-sum).

## Why Gaussian likelihood gives least squares

To obtain an exact small-sample reference distribution, strengthen the model: the errors are independent normal variables with common variance $\sigma^2>0$ and mean zero. Then $Y_i\mid x_i$ is normal with mean $\beta_0+\beta_1x_i$ and variance $\sigma^2$. Normality concerns responses around their conditional means; the predictors themselves need not form a normal sample.

Independence multiplies the observation densities. For candidate coefficients $\beta=(\beta_0,\beta_1)$, define $\operatorname{SSE}(\beta)=\sum_i(y_i-\beta_0-\beta_1x_i)^2$. The likelihood and log-likelihood are

$$L(\beta,\sigma^2)=(2\pi\sigma^2)^{-n/2}\exp\!\left(-\frac{\operatorname{SSE}(\beta)}{2\sigma^2}\right),$$
$$\ell(\beta,\sigma^2)=-\frac n2\ln(2\pi\sigma^2)-\frac{\operatorname{SSE}(\beta)}{2\sigma^2}.$$

For a fixed common variance, the first log term does not depend on the coefficients. Maximizing likelihood therefore minimizes SSE. This explains a statistical assumption behind squared-error fitting. Equal variance gives equal weight to equal squared residuals. If observations have different known variances, their Gaussian contributions instead scale by their own variances; the unweighted objective no longer represents that likelihood. We retain the common-variance model throughout the computations here. It does not say every noise distribution produces the same objective. Also, a likelihood density is not the probability of the exact observed continuous data point.

Suppose candidate A has SSE $12$, candidate B has SSE $20$, and $\sigma^2=4$. Then $\ell(A)-\ell(B)=(20-12)/8=1$, so $L(A)/L(B)=e$. This comparison holds for the same observations and variance. Changing the variance also changes the normalizing term; minimizing only SSE divided by variance would then be wrong.

With variance unknown and a nonzero minimized SSE, maximum likelihood estimates it by $\widehat\sigma^2_{\mathrm{ML}}=\operatorname{SSE}/n$. The usual unbiased residual-variance estimate is instead $s^2=\operatorname{SSE}/(n-2)$ because two coefficients were fitted. For $n=8$ and SSE $18$, these are $9/4$ and $3$. Use $s$ for the t-based standard errors below. Perfect fit with SSE zero is a degenerate variance-estimation case, not evidence that future observations have no uncertainty.

Related definitions: [Residual standard error](ref:probability-statistics-residual-standard-error).

![Residuals connect a fitted line with observations](figure:probability-statistics-figure-21)

## Uncertainty in a coefficient

A fitted slope alone does not show how precisely the population slope has been estimated. Under the independent normal-error model, with $n>2$ and $S_{xx}>0$, estimate its standard error by

$$\operatorname{SE}(b_1)=\frac{s}{\sqrt{S_{xx}}}.$$

More predictor spread helps separate slopes, while greater noise makes the estimate less precise. The standard error is measured in response units per predictor unit, just like the slope. It is not the standard deviation of the response observations. For completeness, the intercept standard error is $\operatorname{SE}(b_0)=s\sqrt{1/n+\bar x^2/S_{xx}}$. Centering the predictor at $\bar x$ makes the new intercept estimate the mean response at the center of the data.

To test $H_0:\beta_1=\beta_{1,0}$, compute

$$t=\frac{b_1-\beta_{1,0}}{\operatorname{SE}(b_1)}.$$

Under the null and the stated assumptions, this statistic has a Student t distribution with $n-2$ degrees of freedom. A two-sided test compares $|t|$ to the supplied critical value $t^*$. The matching confidence interval is $b_1\pm t^*\operatorname{SE}(b_1)$. The multiplier depends on confidence level and degrees of freedom; it is not always $1.96$.

For $n=10$, SSE $8$, $S_{xx}=25$, and $b_1=0.8$, we obtain $s=1$ and $\operatorname{SE}(b_1)=0.2$. Using the supplied 95% multiplier $t^*=2.306$, the interval is $0.8\pm0.4612$, or $[0.3388,1.2612]$. The null value zero gives $t=4$ and is rejected at the matching two-sided level. This is evidence of association under the model, not a probability that the null hypothesis is true or a proof of a useful effect.

Repeated samples produce different intervals. The confidence level describes their long-run coverage of the fixed population slope. A narrow interval can still be misleading when its sampling assumptions fail.

The same standardization works for a nonzero null slope. If an engineering claim specifies a slope of one, subtract one in the numerator; testing against zero would answer another question. A coefficient can be clearly different from zero while still being consistent with a specified practically meaningful value.

Related definitions: [Slope standard error](ref:probability-statistics-slope-standard-error).

## Predicting a mean and predicting one new observation

Fix a predictor value $x_0$ within a region where the model is defensible. The fitted mean is $\widehat y_0=b_0+b_1x_0$. Two questions now have the same point estimate but different uncertainty: what is the population mean response at $x_0$, and what response will one new independent observation have there?

Define $h_0=1/n+(x_0-\bar x)^2/S_{xx}$. The estimated standard error for the fitted mean is $s\sqrt{h_0}$. The standard error for predicting a new response is $s\sqrt{1+h_0}$. Therefore the corresponding intervals, using the same supplied t multiplier with $n-2$ degrees of freedom, are

$$\widehat y_0\pm t^*s\sqrt{h_0}\quad\text{and}\quad\widehat y_0\pm t^*s\sqrt{1+h_0}.$$

The extra one represents a new observation's own error variance. That error is independent of the fitted mean under our model, so variances add. Even perfect knowledge of the population mean would not eliminate individual variation. The formulas assume the new observation follows the same error model; a future measurement from a different process requires a different analysis.

Suppose $n=10$, $\bar x=0$, $S_{xx}=20$, $s=2$, and the fitted mean at $x_0=0$ is $5$. Here $h_0=1/10$. With $t^*=2.306$, the mean-response interval is approximately $[3.5416,6.4584]$. The new-response interval is approximately $[0.1629,9.8371]$. Both intervals are centered at five, but their widths answer different questions.

Moving $x_0$ away from $\bar x$ increases $h_0$, so both intervals widen even before questioning extrapolation. At the center, collecting more suitable observations can make mean uncertainty small; the individual-response uncertainty still includes $s$. A computed interval outside the observed predictor range is not protected against model misspecification merely because its formula produces endpoints. Always name the target quantity when reporting an interval.

Related definitions: [Prediction interval](ref:probability-statistics-prediction-interval).

## Assumptions, diagnostics, and the limits of a slope

The preceding intervals are consequences of a model, so interpreting them requires checking more than arithmetic. The mean response must be linear in the predictor over the relevant range. Errors must have mean zero conditional on the predictor, common variance, and the independence required by the sampling design. Normal errors give the exact t-based small-sample results. None of these assumptions says the predictor must itself be random or normally distributed.

Plot residuals against fitted values or predictors. A U-shaped pattern suggests a missing nonlinear mean structure. A widening fan suggests nonconstant variance. Runs of similar residual signs in time order suggest dependence. A single plot cannot prove the model correct, and mechanically deleting an unusual observation can conceal an important process or measurement problem.

A point with an extreme predictor value has high leverage: it can strongly affect the fitted line. A point can have high leverage and a small residual because it helped pull the line toward itself. Investigate its provenance and compare scientifically defensible analyses. More data collected under the same systematic error do not automatically repair bias.

For a least-squares line with an intercept, define $\operatorname{SST}=\sum_i(y_i-\bar y)^2$ and, when SST is positive, $R^2=1-\operatorname{SSE}/\operatorname{SST}$. If SST is $80$ and SSE is $20$, then $R^2=3/4$: the fitted line accounts for three quarters of the sample's squared variation around its mean. This is a descriptive fitting quantity, not evidence that the predictor causes the response or that prediction on new data will be accurate.

For example, a positive association between study time and assessment scores may involve prior preparation and course selection. A causal claim needs a defensible design and assumptions beyond a regression coefficient. Also distinguish statistical from practical importance: an extremely precise slope of $0.001$ may be too small to matter in the application. Report units, uncertainty, design, and the range of supported prediction together.

Related definitions: [Leverage](ref:probability-statistics-regression-leverage).
