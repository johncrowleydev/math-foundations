import {
  r,
  lesson,
  section,
  termEntry,
  citation,
  q,
  exact,
  tuple,
  truth,
  quick,
  frac,
} from './helpers.mjs';
const bootstrap = citation(
  'assessment-islr-5-2',
  'islr',
  '§5.2 The Bootstrap, printed pp.187–190 / PDF pp.195–198',
  'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf#page=195',
  'Sampling observations with replacement, preserving predictor-response pairs, repeated bootstrap estimates, and their sample standard deviation as an estimated standard error.',
);
const validation = citation(
  'assessment-islr-5-1',
  'islr',
  '§§5.1.1–5.1.4, printed pp.176–185 / PDF pp.184–193',
  'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf#page=184',
  'Validation splits, held-out squared prediction error, k-fold cross-validation, and the distinction between training fit and model assessment.',
);
const metrics = citation(
  'assessment-islr-4-4',
  'islr',
  '§4.4.3, printed pp.145–149 / PDF pp.154–158, Tables 4.6–4.7',
  'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf#page=154',
  'Confusion matrices, sensitivity/recall, specificity, precision, false-positive rates, and effects of classification thresholds.',
);
const risk = citation(
  'assessment-mml-8-2-6',
  'mml',
  '§8.2 Empirical Risk Minimization and §8.6 Model Selection, printed pp.259–266 and 283–288 / PDF pp.265–272 and 289–294',
  'https://mml-book.github.io/book/mml-book.pdf#page=265',
  'Population versus empirical loss, held-out assessment, selection, overfitting and differing costs; examples compute finite expected losses independently.',
);
const sections = [
  section(
    'The empirical distribution and resampling units',
    r`A sample gives a finite distribution that we can study directly. For observations $z_1,\ldots,z_n$, the empirical distribution assigns mass $1/n$ to each observed row. Repeated values collect the masses of their rows. For data $1,1,4,6$, a draw $Z^*$ from the empirical distribution has probabilities $P_*(Z^*=1)=1/2$, $P_*(Z^*=4)=1/4$, and $P_*(Z^*=6)=1/4$. The star reminds us that this randomness is conditional on the recorded data, not a new draw from the unknown population.

The empirical mean is the ordinary sample mean: $E_*[Z^*]=(1+1+4+6)/4=3$. The empirical variance divides centered squared deviations by $n$, giving $(4+4+1+9)/4=9/2$ here. This differs from the sample variance with denominator $n-1$ used to estimate population variance. State which quantity is being calculated.

A nonparametric bootstrap sample draws $n$ rows independently with replacement from the empirical distribution. A selected row returns to the pool before the next draw, so repetitions and omissions are allowed. With three labeled rows, there are $3^3=27$ equally likely ordered index sequences. These sequences need not produce 27 different numerical summaries.

The resampling unit must preserve the relationships being studied. For regression data, sample complete $(x,y)$ pairs together; independently resampling the x and y columns destroys the observed association. If observations are clustered or dependent, independent row resampling may be inappropriate. A defensible design might resample whole independent groups, but choosing a valid dependent-data bootstrap requires more modeling than we develop here.

Resampling cannot invent values or subpopulations absent from the original sample. Its usefulness relies on the empirical distribution being an adequate stand-in for the target population for the statistic of interest. That approximation may be poor with severe selection bias, rare events, or very small samples. The small examples below expose the mechanism without promising reliable population uncertainty from tiny datasets.`,
    [bootstrap],
    [
      termEntry(
        'empirical-distribution',
        'Empirical distribution',
        'Equal probability on each observed row.',
        r`Each of $n$ recorded observations has weight $1/n$; equal values accumulate their weights.`,
        r`For $2,2,5$, the empirical probability of $2$ is $2/3$.`,
        'It describes a sample-based distribution, not certainty about the population probabilities.',
      ),
      termEntry(
        'bootstrap-sample',
        'Bootstrap sample',
        'A same-size sample drawn with replacement from observed data.',
        r`For independent rows, select $n$ row indices independently and uniformly from $1,\ldots,n$.`,
        r`From three rows, indices $(2,2,1)$ form a valid bootstrap sample.`,
        'Without replacement at the same size only rearranges the original sample.',
      ),
    ],
  ),
  section(
    'Bootstrap uncertainty versus more simulation',
    r`The bootstrap repeats an entire statistical calculation. From each resampled dataset, recompute the mean, median, slope, or other statistic. Its distribution across resamples estimates how that statistic might vary under repeated sampling. It does not describe the spread of individual observations unless the statistic itself is an individual observation.

Consider the two-row dataset $2,6$. A bootstrap sample has two draws. The four equally likely ordered outcomes are $(2,2),(2,6),(6,2),(6,6)$, with means $2,4,4,6$. Thus the exact conditional distribution of the bootstrap mean has probabilities $1/4,1/2,1/4$. Its expectation is $4$ and its variance is $(4+0+0+4)/4=2$, giving conditional standard deviation $\sqrt2$. Dividing by four is correct here because we enumerated all equally likely outcomes of a known finite distribution.

Usually enumeration is impractical. Instead generate $B$ independent bootstrap replicates $\widehat\theta_1^*,\ldots,\widehat\theta_B^*$. Their sample standard deviation estimates the conditional bootstrap standard deviation:

$$\widehat{\operatorname{SE}}_{\mathrm{boot}}=\sqrt{\frac{\sum_{b=1}^B(\widehat\theta_b^*-\overline{\theta^*})^2}{B-1}}.$$

For four simulated estimates $1,2,3,4$, the mean is $5/2$, the squared-deviation sum is $5$, and the estimated SE is $\sqrt{5/3}$. The denominator differs from exact enumeration because these are random replicates used to estimate a distribution's spread.

Increasing $B$ makes the simulation's description of that conditional distribution more stable. It does not increase the original sample size or remove selection bias. By contrast, collecting additional independent observations can change the statistical uncertainty itself. Under suitable conditions, bootstrap quantiles can also produce approximate intervals, but interval validity is not automatic, especially for tiny samples or unstable statistics. Here we focus on the resampling mechanism and estimated standard error. Report the original sample size, the resampling unit, and what was recomputed; “we bootstrapped it” alone is not an uncertainty argument.`,
    [bootstrap],
    [
      termEntry(
        'bootstrap-standard-error',
        'Bootstrap standard error',
        'Estimated spread of a statistic over resampled datasets.',
        r`Use the sample standard deviation of independently simulated bootstrap estimates, with denominator $B-1$.`,
        r`Replicates $1,2,3$ have sample standard deviation $1$.`,
        'More bootstrap replicates improve simulation precision; they do not create more original observations.',
      ),
    ],
  ),
  section(
    'Training, validation, and a final test',
    r`A model can fit the observations used to construct it and still predict poorly elsewhere. Split the roles of data before choosing a model. Training data estimate parameters. Validation data compare candidate models or settings, such as polynomial degree or a classification threshold. A final test set is reserved for assessment after those choices are complete. Once its results influence choices, it is no longer an untouched test set for those choices.

For a continuous response, mean squared prediction error on $m$ held-out observations is

$$\operatorname{MSE}_{\mathrm{held\ out}}=\frac1m\sum_{i=1}^m(y_i-\widehat y_i)^2.$$

The predictions must come from fitting that excluded those observations. If held-out responses are $1,3,5$ and predictions are $2,2,4$, the errors are $-1,1,1$ and the MSE is $1$. The root MSE is in response units; MSE has squared response units. A negative residual does not subtract from the loss because it is squared.

Data leakage occurs when information reserved for evaluation influences fitting. For example, estimate a feature's centering mean from training data, then apply that same mean to validation and test data. Choosing a transformation after inspecting test errors also leaks evaluation information. The same discipline applies to feature selection and threshold tuning, not just coefficient estimation.

In k-fold cross-validation, divide the available development data into k groups. Each group is held out once while a model is fitted on the other groups. Average the held-out losses to compare candidates; with unequal fold sizes, weighting fold means by observation counts produces the overall observation-level MSE. Refit the chosen procedure as appropriate, then evaluate its final performance on the reserved test set.

The split must match deployment. For future-time prediction, a random split can expose future information to training. For predictions on new people, rows from the same person should not casually appear on both sides. The goal is a credible simulation of the future prediction task, not merely a convenient partition.`,
    [validation, risk],
    [
      termEntry(
        'validation-data',
        'Validation data',
        'Held-out data used to choose models or settings.',
        'Validation results guide selection; a final test evaluates the selected procedure without guiding it.',
        'Choose polynomial degree by validation MSE, then report performance on a reserved test set.',
        'Repeatedly selecting against the test set turns it into validation data.',
      ),
      termEntry(
        'data-leakage',
        'Data leakage',
        'Evaluation information influencing model construction.',
        'Leakage includes preprocessing, feature selection, and tuning using information intended to be held out.',
        'Computing a centering mean using test observations leaks their feature information.',
        'A label need not be copied directly into training for leakage to occur.',
      ),
    ],
  ),
  section(
    'Reading a confusion matrix',
    r`For binary classification, a prediction is either positive or negative and the observed truth is also positive or negative. Fix the positive class before calculating metrics. A true positive (TP) is a positive prediction on an actual positive; a false positive (FP) predicts positive on an actual negative. A false negative (FN) misses an actual positive, and a true negative (TN) correctly predicts an actual negative.

Suppose a held-out confusion matrix has TP $18$, FN $6$, FP $12$, and TN $64$, for 100 observations. Accuracy is $(\mathrm{TP}+\mathrm{TN})/N=82/100=0.82$. Recall, also called sensitivity, is $\mathrm{TP}/(\mathrm{TP}+\mathrm{FN})=18/24=0.75$: among actual positives, how many were found? Precision is $\mathrm{TP}/(\mathrm{TP}+\mathrm{FP})=18/30=0.60$: among predicted positives, how many were positive?

Specificity is $\mathrm{TN}/(\mathrm{TN}+\mathrm{FP})=64/76=16/19$. The false-positive rate has the same denominator and equals $12/76=3/19$. These are conditional proportions with different conditioning groups. Precision and recall are therefore not interchangeable, even when their numerical values happen to agree.

Among predicted positives, the false-discovery fraction is $\mathrm{FP}/(\mathrm{TP}+\mathrm{FP})$, the complement of precision. In our example it is $12/30=0.40$. This differs from the false-positive rate because the conditioning group differs. If a metric denominator is zero, explain that it is undefined under these formulas instead of silently replacing it by a number.

When positives are rare, accuracy can conceal a useless detector: predicting negative for everyone in a population with 2% positives gives 98% accuracy and zero recall. Changing a score threshold trades missed positives against false alarms. Choose that threshold using validation data and the application's consequences, then assess it on held-out data. A single aggregate metric never fully describes which errors a model makes.`,
    [metrics],
    [
      termEntry(
        'classification-precision',
        'Classification precision',
        'Fraction of predicted positives that are actual positives.',
        r`$\mathrm{precision}=\mathrm{TP}/(\mathrm{TP}+\mathrm{FP})$ when the denominator is positive.`,
        r`Twelve correct positives among twenty positive predictions give precision $3/5$.`,
        'Recall conditions on actual positives instead.',
      ),
      termEntry(
        'classification-recall',
        'Classification recall',
        'Fraction of actual positives identified as positive.',
        r`$\mathrm{recall}=\mathrm{TP}/(\mathrm{TP}+\mathrm{FN})$.`,
        r`Twelve detected positives out of sixteen actual positives give recall $3/4$.`,
        'High accuracy on an imbalanced sample does not ensure high recall.',
      ),
    ],
  ),
  section(
    'Matching assessment to the decision',
    r`A model's usefulness depends on what errors cost and which population will use it. An evaluation target should therefore state the outcome, the prediction time, the unit of observation, and the loss being measured. The empirical mean loss estimates expected loss for a population represented by the held-out data; changing that population can change performance even with the same fitted model.

Consider a binary decision with a false-positive cost $c_{\mathrm{FP}}>0$, a false-negative cost $c_{\mathrm{FN}}>0$, and zero cost for correct decisions. If the positive-class probability for one case is $p$, predicting positive has expected cost $c_{\mathrm{FP}}(1-p)$, while predicting negative has expected cost $c_{\mathrm{FN}}p$. Prefer positive when

$$p>\frac{c_{\mathrm{FP}}}{c_{\mathrm{FP}}+c_{\mathrm{FN}}}.$$

Equality gives a cost tie. With costs $1$ and $4$, the threshold is $1/5$. For $p=0.3$, positive prediction costs $0.7$ in expectation, versus $1.2$ for negative prediction. This calculation assumes the supplied probability is appropriate for this case and population; a poorly calibrated score is not automatically such a probability.

For regression, compare prediction errors on the same held-out cases. A flexible model with training MSE $0.1$ and validation MSE $4$ can be less useful than a simpler model with training MSE $1$ and validation MSE $2$. Coefficient significance answers a different question from predictive accuracy. Likewise, bootstrapping a training slope measures one aspect of estimation variability; it does not substitute for an honest prediction test.

Complete an analysis by stating what remains uncertain. Small validation sets make model rankings unstable. Reusing them for many choices can overfit the selection process. Group or time shifts can invalidate a seemingly precise assessment. An observational predictor can help predict without establishing a causal effect. Choose a loss aligned with the real decision, keep evaluation independent of fitting, and limit conclusions to the design and population the evidence supports.`,
    [risk, validation, metrics],
    [
      termEntry(
        'expected-prediction-loss',
        'Expected prediction loss',
        'Average loss under the population where predictions will be used.',
        r`For finite cases, risk is $\sum_i p_i\,\ell_i$; held-out average loss estimates it under a representative design.`,
        r`Losses $1,5$ with probabilities $3/4,1/4$ give risk $2$.`,
        'Training loss, selected validation loss, and future population loss have different roles.',
      ),
    ],
  ),
];
sections[0].questions.push(
  q(
    r`For recorded values $2,2,5,7$, give the empirical probabilities of $2,5,7$, in that order.`,
    r`Count rows and divide by four: the masses are $1/2,1/4,1/4$.`,
    tuple(['1/2', '1/4', '1/4']),
  ),
  q(
    r`For the same empirical distribution from $2,2,5,7$, calculate its mean.`,
    r`Average all four rows, including repeated values: $(2+2+5+7)/4=4$.`,
    exact(4),
  ),
  q(
    r`For the empirical distribution from $2,2,5,7$, calculate its variance around mean $4$.`,
    r`Divide the squared deviations by four: $(4+4+1+9)/4=9/2$.`,
    exact('9/2'),
  ),
  q(
    r`A dataset has three labeled rows. How many ordered index sequences are possible in a size-three bootstrap sample?`,
    r`Each of three independent draws has three choices, giving $3^3=27$.`,
    exact(27),
  ),
  q(
    r`From four labeled rows, what is the probability of the particular bootstrap index sequence $(2,2,1,4)$?`,
    r`Each specified draw has probability $1/4$, so the product is $(1/4)^4=1/256$.`,
    exact('1/256'),
  ),
  q(
    r`From four labeled rows, what is the probability that row 1 never appears in a size-four bootstrap sample?`,
    r`Every draw must choose one of the other three rows. The probability is $(3/4)^4=81/256$.`,
    exact('81/256'),
  ),
  q(
    r`From three labeled rows, what is the probability that row 2 appears at least once in a size-three bootstrap sample?`,
    r`Use the complement of omission: $1-(2/3)^3=19/27$.`,
    exact('19/27'),
  ),
  q(
    r`For empirical values $0,1,1,1$, what is the probability that two independent empirical draws both equal one?`,
    r`Each has probability $3/4$, so the joint probability is $9/16$.`,
    exact('9/16'),
  ),
  q(
    'Is a repeated row allowed in a bootstrap sample drawn with replacement?',
    'Yes. Each selected row returns to the pool before the next draw.',
    truth(true),
  ),
  q(
    'Why is resampling the predictor and response columns independently unsuitable for bootstrapping an observed regression association?',
    'It breaks the pairing that records which response belongs to each predictor. Resample complete pairs to retain the empirical joint distribution.',
  ),
  q(
    'Why can ordinary resampling fail to reveal a subgroup absent from the original sample?',
    'Every resampled row comes from observed data. An unobserved subgroup receives no empirical mass, so repeated resampling cannot repair its absence.',
  ),
);
sections[1].questions.push(
  q(
    r`From data $0,4$, give the bootstrap means for ordered resamples $(0,0),(0,4),(4,0),(4,4)$.`,
    r`Average each pair: the means are $0,2,2,4$.`,
    tuple([0, 2, 2, 4]),
  ),
  q(
    r`For the exact equally likely bootstrap means $0,2,2,4$, compute their expectation.`,
    r`The probability-weighted mean is $(0+2+2+4)/4=2$.`,
    exact(2),
  ),
  q(
    r`For the exact equally likely bootstrap means $0,2,2,4$, compute their variance.`,
    r`Their mean is $2$. The variance is $(4+0+0+4)/4=2$.`,
    exact(2),
  ),
  q(
    r`For a size-two bootstrap of data $0,4$, what is the probability its mean equals $2$?`,
    r`Two of the four ordered outcomes give mean $2$, so the probability is $1/2$.`,
    exact('1/2'),
  ),
  q(
    r`Three independently simulated bootstrap estimates are $3,4,5$. Compute their sample standard deviation.`,
    r`Their mean is $4$, and the centered squared sum is $2$. Divide by $3-1$ and take a square root to obtain $1$.`,
    exact(1),
  ),
  q(
    r`Four simulated bootstrap estimates are $0,0,2,2$. Compute the estimated bootstrap standard error.`,
    r`The mean is $1$, the squared-deviation sum is $4$, and the sample standard deviation is $\sqrt{4/3}=2/\sqrt3$.`,
    exact('2/sqrt(3)'),
  ),
  q(
    r`A bootstrap sample from three original values is $2,2,8$. Recompute its mean and median.`,
    r`The mean is $(2+2+8)/3=4$; the middle ordered observation is $2$.`,
    tuple([4, 2]),
  ),
  q(
    r`The empirical observation variance is $12$. For a mean of three independent bootstrap draws, what is the exact conditional variance?`,
    r`Independence gives the mean variance $12/3=4$.`,
    exact(4),
  ),
  q(
    'If the number of bootstrap replicates is quadrupled while the original data stay fixed, does the underlying conditional bootstrap standard deviation become half as large?',
    'No. The conditional distribution remains the same. Its simulated description becomes more precise, but its spread is not divided by two.',
    truth(false),
  ),
  q(
    'Why do four exhaustively enumerated equally likely bootstrap outcomes use probability weights 1/4, while four simulated estimates use denominator 3 to estimate variance?',
    'Enumeration gives the whole conditional probability distribution. Simulated estimates are a random sample from it, so their sample variance uses B−1 to estimate its variance.',
  ),
  q(
    'Does a very large number of bootstrap replicates cure selection bias in the original sample?',
    'No. The procedure repeatedly samples the same biased empirical distribution.',
    truth(false),
  ),
);
sections[2].questions.push(
  q(
    r`Split 200 observations into 60% training, 20% validation, and the rest test. Give the three sizes.`,
    r`The sizes are $120,40,40$, which sum to 200.`,
    tuple([120, 40, 40]),
  ),
  q(
    r`Held-out responses are $2,4,6$ and predictions are $1,4,8$. Compute prediction MSE.`,
    r`Errors are $1,0,-2$, with squared sum $5$. Divide by three to get $5/3$.`,
    exact('5/3'),
  ),
  q(
    r`Held-out MSE is $9$. What is root MSE?`,
    r`Taking the nonnegative square root gives $3$ in response units.`,
    exact(3),
  ),
  q(
    r`Two held-out folds have sizes $2,6$ and MSE values $1,3$. Compute the overall observation-weighted MSE.`,
    r`The combined squared-error sum is $2(1)+6(3)=20$. Divide by eight to get $5/2$.`,
    exact('5/2'),
  ),
  q(
    r`A development sample has 80 observations in five equal cross-validation folds. How many observations train each fold's model?`,
    r`One fold has $16$ observations. Excluding it leaves $80-16=64$.`,
    exact(64),
  ),
  q(
    r`Training feature values are $2,4,6$ and a validation value is $10$. Center using the training mean. What centered validation value results?`,
    r`The training mean is $4$; apply that fixed value to obtain $10-4=6$.`,
    exact(6),
  ),
  q(
    r`For equal held-out fold sizes, MSE values are $2,4,3$. Compute the cross-validation MSE.`,
    r`Equal weights give $(2+4+3)/3=3$.`,
    exact(3),
  ),
  q(
    'Can a test set remain untouched assessment data after its error is repeatedly used to choose polynomial degree?',
    'No. Those decisions use it for selection, so it now functions as validation data.',
    truth(false),
  ),
  q(
    'Should centering parameters be recomputed from each held-out fold before using a trained model on that fold?',
    'No. Estimate preprocessing parameters from that fold’s training portion and apply the same transformation to its held-out observations.',
    truth(false),
  ),
  q(
    'Explain why random row splitting can be misleading when the deployment task predicts later measurements from earlier ones.',
    'A random split may place future observations in training. A time-respecting split better represents the information available at prediction time.',
  ),
  q(
    'Several records belong to each person, and the goal is prediction for previously unseen people. Explain a defensible splitting unit.',
    'Keep each person’s records together and hold out whole people. Otherwise training can learn person-specific information also present in evaluation rows.',
  ),
);
// Each case supplies the full matrix so the requested conditioning denominator is explicit.
for (const [tp, fn, fp, tn, label] of [
  [12, 4, 8, 16, 'A'],
  [3, 9, 1, 27, 'B'],
]) {
  sections[3].questions.push(
    q(
      r`Classifier ${label} has TP=${tp}, FN=${fn}, FP=${fp}, TN=${tn}. Compute accuracy.`,
      r`Correct classifications are TP+TN. Divide by the total: $(${tp}+${tn})/${tp + fn + fp + tn}=${frac(tp + tn, tp + fn + fp + tn)}$.`,
      exact(frac(tp + tn, tp + fn + fp + tn)),
    ),
    q(
      r`For TP=${tp}, FN=${fn}, FP=${fp}, TN=${tn}, compute precision.`,
      r`Condition on predicted positives: $${tp}/(${tp}+${fp})=${frac(tp, tp + fp)}$.`,
      exact(frac(tp, tp + fp)),
    ),
    q(
      r`For TP=${tp}, FN=${fn}, FP=${fp}, TN=${tn}, compute recall.`,
      r`Condition on actual positives: $${tp}/(${tp}+${fn})=${frac(tp, tp + fn)}$.`,
      exact(frac(tp, tp + fn)),
    ),
  );
}
sections[3].questions.push(
  q(
    r`For TP=12, FN=4, FP=8, TN=16, compute specificity and false-positive rate.`,
    r`There are $24$ actual negatives. Specificity is $16/24=2/3$ and false-positive rate is $8/24=1/3$.`,
    tuple(['2/3', '1/3']),
  ),
  q(
    r`For TP=12, FN=4, FP=8, TN=16, compute the false-discovery fraction among positive predictions.`,
    r`There are $20$ positive predictions, and eight are false: $8/20=2/5$.`,
    exact('2/5'),
  ),
  q(
    r`Among 100 held-out observations, 5 are positive. An always-negative classifier makes what accuracy?`,
    r`It correctly classifies the 95 negatives, giving $95/100=19/20$.`,
    exact('19/20'),
  ),
  q(
    'A classifier predicts no positive cases. Is its precision defined by TP/(TP+FP)?',
    'No. Both TP and FP are zero, leaving a zero denominator.',
    truth(false),
  ),
  q(
    'Explain how high accuracy can coexist with zero recall.',
    'If the positive class is rare, predicting negative for everyone correctly classifies most observations but finds none of the actual positives.',
  ),
);
for (const [fp, fn, pn, pd] of [
  [1, 4, 3, 10],
  [3, 2, 1, 2],
  [2, 6, 1, 4],
]) {
  sections[4].questions.push(
    q(
      r`False-positive cost is ${fp} and false-negative cost is ${fn}, with zero cost for correct decisions. Give the positive-probability threshold above which positive prediction has smaller expected cost.`,
      r`Solve $${fp}(1-p)<${fn}p$, giving $p>${frac(fp, fp + fn)}$.`,
      exact(frac(fp, fp + fn)),
    ),
    q(
      r`With $p=${pn}/${pd}$, false-positive cost ${fp}, and false-negative cost ${fn}, give the expected costs of positive and negative predictions, in that order.`,
      r`Positive prediction costs $${fp}(1-${pn}/${pd})=${frac(fp * (pd - pn), pd)}$; negative prediction costs $${fn}(${pn}/${pd})=${frac(fn * pn, pd)}$.`,
      tuple([frac(fp * (pd - pn), pd), frac(fn * pn, pd)]),
    ),
  );
}
sections[4].questions.push(
  q(
    r`A held-out confusion matrix has 6 false positives and 4 false negatives among 50 cases. With costs 2 and 5 respectively, compute average cost per case.`,
    r`Total cost is $2(6)+5(4)=32$. Divide by 50 to obtain $16/25$.`,
    exact('16/25'),
  ),
  q(
    r`Loss is $1$ in a group of probability $3/4$ and $5$ in a group of probability $1/4$. Compute expected loss.`,
    r`Weight losses by target-population probabilities: $3/4+5/4=2$.`,
    exact(2),
  ),
  q(
    r`The same group losses are $1$ and $5$, but their target probabilities change to $1/4$ and $3/4$. Compute the new expected loss.`,
    r`The new risk is $1/4+15/4=4$. The model's group losses need not change for overall risk to change.`,
    exact(4),
  ),
  q(
    'A flexible model has training MSE 0.1 and validation MSE 4; a simpler model has training MSE 1 and validation MSE 2. Which is better supported for selection, and what remains to do?',
    'The simpler model has lower validation error on this comparison. After completing selection, assess the chosen procedure on a reserved test set and consider sampling uncertainty and deployment fit.',
  ),
  q(
    'A bootstrap slope interval excludes zero. Does this alone establish low prediction error or a causal effect?',
    'No. The interval addresses coefficient uncertainty under the resampling model. Prediction needs appropriate held-out assessment, and causation needs additional design assumptions.',
    truth(false),
  ),
);
sections[0].review.push(
  q(
    r`From values $1,3,3,3,5$, what empirical probability is assigned to $3$?`,
    r`Three of five rows equal three, so the probability is $3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Two labeled rows are resampled twice with replacement. How many ordered index sequences are possible?`,
    r`Each draw has two choices, giving $2^2=4$.`,
    exact(4),
  ),
  q(
    'Does a same-size draw without replacement create new bootstrap means from a fixed dataset?',
    'No. It only permutes the observations, so their mean is unchanged.',
    truth(false),
  ),
);
sections[1].review.push(
  q(
    r`The exact bootstrap-mean distribution puts probabilities $1/4,1/2,1/4$ at $1,3,5$. Compute its variance.`,
    r`The mean is three. The variance is $(1/4)4+(1/2)0+(1/4)4=2$.`,
    exact(2),
  ),
  q(
    r`Simulated bootstrap estimates are $2,4,6$. Compute their sample standard deviation.`,
    r`Their mean is four, their centered squared sum is eight, and dividing by two gives variance four. The standard deviation is $2$.`,
    exact(2),
  ),
  q(
    'What does increasing B improve when the original observations are fixed?',
    'It improves Monte Carlo precision in describing the same conditional bootstrap distribution; it does not add original population information.',
  ),
);
sections[2].review.push(
  q(
    r`Held-out residuals are $-2,1,2,1$. Compute MSE.`,
    r`The squared-error sum is $4+1+4+1=10$, so MSE is $10/4=5/2$.`,
    exact('5/2'),
  ),
  q(
    r`Three equal folds contain 30 observations each. How many observations train one fold's model?`,
    r`Hold out thirty and train on the remaining sixty.`,
    exact(60),
  ),
  q(
    'Which dataset should choose a classification threshold when a final test set is reserved?',
    'Use validation data for the choice; preserve the test set for the selected rule’s final assessment.',
  ),
);
sections[3].review.push(
  q(
    r`A classifier has TP=9, FN=3, FP=6, TN=22. Compute recall.`,
    r`There are twelve actual positives, so recall is $9/12=3/4$.`,
    exact('3/4'),
  ),
  q(
    r`For the same counts TP=9, FN=3, FP=6, TN=22, compute precision.`,
    r`There are fifteen predicted positives, so precision is $9/15=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`A classifier has 20 actual negatives, of which 2 are false positives. Compute specificity.`,
    r`The other eighteen are true negatives, so specificity is $18/20=9/10$.`,
    exact('9/10'),
  ),
);
sections[4].review.push(
  q(
    r`False-positive cost is 4 and false-negative cost is 1. Give the optimal positive-probability threshold under the stated zero-correct-cost model.`,
    r`Compare $4(1-p)$ with $p$ to obtain threshold $4/5$.`,
    exact('4/5'),
  ),
  q(
    r`Losses $2$ and $8$ occur with probabilities $2/3$ and $1/3$. Compute expected loss.`,
    r`The weighted average is $4/3+8/3=4$.`,
    exact(4),
  ),
  q(
    'A validation score improves after hundreds of model choices on the same validation set. Explain why independent final assessment still matters.',
    'Selection can adapt to chance features of the validation data. An independent final test better assesses the selected procedure on information that did not guide those choices.',
  ),
);
sections[1].quickCheck = quick(
  'Keeping the original data fixed while increasing the number of bootstrap replicates primarily does what?',
  [
    'Adds independent population observations',
    'Reduces simulation noise in describing the bootstrap distribution',
    'Eliminates selection bias',
  ],
  1,
  'More replicates approximate the same conditional distribution more precisely.',
  [
    'The original sample size is unchanged.',
    'Correct: simulation precision improves while the underlying empirical distribution stays fixed.',
    'The same empirical data cannot repair omitted or systematically selected population cases.',
  ],
);
sections[3].quickCheck = quick(
  'Which denominator belongs in precision?',
  [
    'The number of actual positives',
    'The number of predicted positives',
    'The total number of observations',
  ],
  1,
  'Precision asks what fraction of positive predictions are correct.',
  [
    'Actual positives form the denominator for recall.',
    'Correct: precision is TP divided by TP+FP.',
    'The total number of observations is used for accuracy.',
  ],
);
export default lesson(
  22,
  'resampling-model-assessment',
  'Resampling and Model Assessment',
  'Use empirical distributions to inspect uncertainty, separate fitting from evaluation, and judge predictions using appropriate held-out losses. This final lesson connects probability, estimation, regression, and the practical limits of statistical evidence.',
  sections,
);
