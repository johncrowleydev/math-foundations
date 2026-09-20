import {
  r,
  lesson,
  section,
  citation,
  termEntry,
  q,
  exact,
  calc,
  tuple,
  truth,
  term,
  quick,
} from './helpers.mjs';
const definitions = citation(
  'os-stat-1-1',
  'openstax-statistics-2e',
  '§1.1 Definitions of Statistics, Probability, and Key Terms',
  'https://openstax.org/books/introductory-statistics-2e/pages/1-1-definitions-of-statistics-probability-and-key-terms',
  'Populations, samples, parameters, statistics, and descriptive versus inferential questions.',
);
const sampling = citation(
  'os-stat-1-2',
  'openstax-statistics-2e',
  '§1.2 Data, Sampling, and Variation in Data and Sampling',
  'https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling',
  'Data types, probability sampling designs, convenience sampling, missing data, and sampling variation.',
);
const center = citation(
  'os-stat-2-5',
  'openstax-statistics-2e',
  '§2.5 Measures of the Center of the Data',
  'https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data',
  'Means, medians, modes, weighted frequency calculations, and grouped-data limitations.',
);
const spread = citation(
  'os-stat-2-7',
  'openstax-statistics-2e',
  '§2.7 Measures of the Spread of the Data',
  'https://openstax.org/books/introductory-statistics-2e/pages/2-7-measures-of-the-spread-of-the-data',
  'Sample variance, standard deviation, centered sums, and changes of units.',
);
const design = citation(
  'os-stat-1-4',
  'openstax-statistics-2e',
  '§1.4 Experimental Design and Ethics',
  'https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics',
  'Observational studies, explanatory/response variables, random assignment, masking, and responsible reporting.',
);
const s1 = section(
  'Define the population, observation, and question',
  r`Probability begins with a specified model and asks what outcomes it predicts. Statistics starts with observed data and asks what those observations justify about an underlying population or process. **Descriptive statistics** summarize the collected observations. **Statistical inference** uses a sampling or data-generation model to draw conclusions beyond them, while acknowledging uncertainty.

A population is the collection of units about which a question is asked. A sample is the collection actually observed. A parameter is a numerical feature of the population or model, such as a mean response time $\mu$. A statistic is computed from the sample, such as $\bar x$. The same numerical formula can describe a parameter or a statistic depending on what collection it summarizes.

Suppose a service operator wants the mean duration of all completed requests on a particular day and inspects two hundred randomly selected requests from that day. Requests are the observational units, duration is the variable, all completed requests that day form the population, and the selected two hundred form the sample. The mean of the two hundred durations is a statistic. Generalizing to next month would introduce another assumption: the target process may change over time.

Data types constrain sensible summaries. A category such as operating-system family is qualitative even if encoded using integers. A count of retries is quantitative and discrete. A measured duration is quantitative and often modeled continuously, although the stored number is rounded. A binary indicator is especially useful because its sample mean equals the proportion coded one.

Clarify the unit before counting observations. Ten measurements from each of twenty devices produce two hundred readings, but only twenty devices. Readings from one device can be dependent. If the scientific question concerns devices, treating two hundred rows as two hundred independent devices overstates the information. Record units, time window, inclusion criteria, missingness, and the target quantity before choosing a formula. These choices are part of the mathematical model connecting data to a claim.`,
  [definitions, sampling],
  [
    termEntry(
      'parameter-statistic',
      'Parameter and statistic',
      'A parameter describes the target population; a statistic describes the sample.',
      r`The population mean is $\mu$; the observed sample mean is $\bar x$.`,
      `The failure proportion in all requests is a parameter; the proportion in a sampled batch is a statistic.`,
      `A statistic becomes a known value after observation, though its sampling version is random.`,
    ),
    termEntry(
      'observational-unit',
      'Observational unit',
      'The entity on which variables are measured.',
      'A unit may be a person, device, request, experiment, or other defined entity.',
      'Repeated readings from one device do not create new devices.',
      'Rows, measurements, and independent units are not automatically the same thing.',
    ),
  ],
);
s1.questions = [
  q(
    r`The mean duration of every request in the target day's population is a parameter or a statistic? Enter one word.`,
    `Parameter. It summarizes the entire defined population.`,
    term('parameter', 'statistic'),
    'interpret',
  ),
  q(
    r`The mean duration of fifty sampled requests is a parameter or a statistic? Enter one word.`,
    `Statistic. It is calculated from the observed sample.`,
    term('statistic', 'parameter'),
    'interpret',
  ),
  q(
    r`A dataset codes operating-system families as $1,2,3$. Is this variable categorical or quantitative? Enter one word.`,
    `Categorical. The numbers label categories and do not represent measured magnitudes.`,
    term('categorical', 'quantitative'),
    'interpret',
  ),
  q(
    r`Is the number of retries before completion discrete or continuous? Enter one word.`,
    `Discrete. It takes nonnegative integer count values.`,
    term('discrete', 'continuous'),
    'interpret',
  ),
  q(
    r`A sample of forty requests contains six failures. Find the sample failure proportion.`,
    r`$6/40=3/20$.`,
    exact('3/20'),
  ),
  q(
    r`Twenty devices each contribute ten readings. How many distinct devices were observed?`,
    r`There are $20$ devices, even though there are two hundred readings.`,
    exact('20'),
  ),
  q(
    r`A sample contains binary observations $1,0,1,1,0$. Find their mean.`,
    r`There are three ones among five observations, so the mean is $3/5$.`,
    exact('3/5'),
  ),
  q(
    r`True or false: describing all recorded observations necessarily justifies a claim about future observations.`,
    r`False. Generalization requires assumptions about how the target population or process relates to the observed data.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Define a population and observational unit for a study of daily battery life across a model of laptop.`,
    r`For example, the population could be all devices of that model used during a specified month under stated conditions, and the unit could be a device-day. Repeated days from the same device should be identified because they may be dependent.`,
  ),
  q(
    r`Explain why a sample can be representative of one population and unsuitable for another.`,
    r`Representation is relative to the target. A random sample of one day's requests can describe that day, while a changed workload or software version makes extrapolation to another period questionable.`,
  ),
];
s1.review = [
  q(
    r`The median file size among twelve sampled files is a parameter or a statistic? Enter one word.`,
    `Statistic. It is computed from the sample of twelve files.`,
    term('statistic', 'parameter'),
    'interpret',
  ),
  q(
    r`Nine successes are observed in fifteen trials. Find the binary sample mean.`,
    r`The sample mean is the success proportion, $9/15=3/5$.`,
    exact('3/5'),
  ),
  q(
    r`Five observations are recorded for each of thirty users. Find the number of distinct users.`,
    r`There are $30$ users; repeated observations do not change that count.`,
    exact('30'),
  ),
];
const s2 = section(
  'Summarize location without hiding the data',
  r`For numeric observations $x_1,\ldots,x_n$, the sample mean is $\bar x=(1/n)\sum_i x_i$. Every observation contributes, including unusually large or small values. If a value $v_j$ occurs $n_j$ times, the same formula becomes $\bar x=\sum_j n_jv_j/\sum_j n_j$. Frequencies are counts of observations, not extra quantities to average equally.

The median is the middle value after sorting; for an even number of observations, this lesson uses the average of the two middle values. The mode is a most frequent value and need not be unique. These summaries answer different questions. The mean balances total magnitude, the median divides the ordered sample, and the mode identifies frequent values.

Consider durations $1,2,2,3,12$. Their mean is four, median two, and mode two. Replacing twelve by twenty-two increases the mean to six while leaving the median and mode unchanged. This does not make the large observation invalid. It shows that the mean responds to magnitude in a way the median does not. Examine the data-generation process before excluding an extreme value; it could be a recording error, a rare genuine outcome, or evidence against the assumed model.

Combining groups requires their sizes. A group of ten observations with mean four and a group of thirty with mean eight have combined mean $(10\cdot4+30\cdot8)/40=7$. The unweighted mean six describes equally weighted groups, not equally weighted observations. This is the sample counterpart of total expectation.

A frequency table of exact values preserves enough information to calculate the exact mean. A table of intervals generally does not. Substituting each interval midpoint produces an estimate unless all values actually equal those midpoints. Always distinguish a calculation from complete data from one using grouped approximations. Reporting a center together with sample size and information about spread makes the summary much more interpretable than reporting a center alone.`,
  [center, sampling],
  [
    termEntry(
      'sample-mean-median',
      'Sample mean and median',
      'Two distinct summaries of numerical location.',
      r`$\bar x=\sum_i x_i/n$; the median is the middle ordered value, averaging the two middle values when $n$ is even.`,
      r`Data $1,2,2,3,12$ have mean four and median two.`,
      `The mean and median need not agree, especially with skew or extreme values.`,
    ),
  ],
);
s2.questions = [
  q(
    r`Find the mean of $1,2,2,3,12$.`,
    r`The sum is twenty and there are five values, so the mean is $4$.`,
    exact('4'),
  ),
  q(
    r`Find the median of $12,2,1,3,2$.`,
    r`Sort to $1,2,2,3,12$; the middle value is $2$.`,
    exact('2'),
  ),
  q(
    r`Find the mode of $1,2,2,3,12$.`,
    r`Two occurs twice, more often than any other value, so the mode is $2$.`,
    exact('2'),
  ),
  q(
    r`Find the median of $1,4,7,10$, using the average of the two middle values.`,
    r`$(4+7)/2=11/2$.`,
    exact('11/2'),
  ),
  q(
    r`Values zero, one, and two have frequencies two, three, and five. Find the sample mean.`,
    r`The weighted sum is $0(2)+1(3)+2(5)=13$, divided by ten observations: $13/10$.`,
    exact('13/10'),
  ),
  q(
    r`Ten observations have mean four; thirty have mean eight. Find the combined mean.`,
    r`$(10\cdot4+30\cdot8)/40=7$.`,
    exact('7'),
  ),
  q(
    r`A sample of five values has mean six. Four values are $2,4,7,8$. Find the fifth.`,
    r`The total must be thirty. The four known values sum to twenty-one, so the fifth is $9$.`,
    exact('9'),
  ),
  q(
    r`A single observation in a sample of ten increases by twenty. By how much does the mean increase?`,
    r`The sum rises by twenty and sample size stays ten, so the mean rises by $2$.`,
    exact('2'),
  ),
  q(
    r`Explain why a histogram with broad intervals does not usually determine the exact mean.`,
    r`It gives counts within intervals but not the precise observations. Different arrangements within the same bins can have different sums and means.`,
  ),
  q(
    r`Two datasets have the same mean. Explain why this does not show their distributions are similar.`,
    r`A mean is one summary. For example, $0,0,10,10$ and $5,5,5,5$ both average five, but their spreads and observed values differ greatly.`,
  ),
];
s2.review = [
  q(
    r`Find the median of $8,1,9,2,7,3$ using the two-middle-value convention.`,
    r`Sort to $1,2,3,7,8,9$. The median is $(3+7)/2=5$.`,
    exact('5'),
  ),
  q(
    r`Four observations average three and six average eight. Find the combined mean.`,
    r`$(4\cdot3+6\cdot8)/10=60/10=6$.`,
    exact('6'),
  ),
  q(
    r`Values $1,4,7$ occur with frequencies $2,1,3$. Find their mean.`,
    r`$(2+4+21)/6=27/6=9/2$.`,
    exact('9/2'),
  ),
];
s2.quickCheck = quick(
  r`Two groups have different sizes. Which calculation gives the mean across all individual observations?`,
  [
    `The simple average of the two group means.`,
    `The group-size-weighted average of the group means.`,
    `The larger of the two group means.`,
  ],
  1,
  `Each observation receives equal weight by weighting each group mean by its sample size.`,
  [
    `This gives equal influence to each group rather than each observation and is generally wrong when group sizes differ.`,
    `Correct. Multiply each mean by its group size, add the totals, and divide by the combined size.`,
    `The maximum discards the other group's observations and does not calculate an overall average.`,
  ],
);
const s3 = section(
  'Describe spread and distinguish empirical from model variation',
  r`The range is the largest observation minus the smallest. It is easy to calculate but depends only on two values. A more comprehensive measure is the sample variance, $s^2=\frac{1}{n-1}\sum_i(x_i-\bar x)^2$ for $n\ge2$. The sample standard deviation is $s=\sqrt{s^2}$. Variance uses squared units, while standard deviation has the observations' original units.

For data $1,2,3$, the mean is two and the squared deviations sum to $1+0+1=2$. Thus $s^2=2/(3-1)=1$ and $s=1$. The denominator is explicitly $n-1$. A different descriptive quantity, the variance of the empirical distribution assigning probability $1/n$ to each observation, uses denominator $n$ and equals $2/3$ here. The two quantities have different definitions and should not be silently interchanged.

Why use $n-1$ when estimating a population variance? The deviations from the fitted sample mean sum to zero, so estimating that center uses one degree of freedom. Under independent identically distributed sampling with finite variance, the resulting $s^2$ has expectation equal to the population variance. This does not mean it equals the population variance in every sample, and its square root is not automatically an unbiased estimator of population standard deviation.

Translation leaves spread unchanged. Multiplying all values by $a$ multiplies variance by $a^2$ and standard deviation by $|a|$. The computational identity $\sum_i(x_i-\bar x)^2=\sum_i x_i^2-n\bar x^2$ can simplify exact hand calculations. For large nearly equal floating-point values, direct subtraction of these two large terms can be numerically delicate; the centered definition remains the conceptual reference.

Distinguish variability among observations from variability among sample statistics. A sample can contain widely spread individual values while its mean is comparatively stable across repeated independent samples. The next lesson makes that distinction precise through the sampling distribution and standard error of the mean.`,
  [spread, definitions],
  [
    termEntry(
      'sample-variance',
      'Sample variance',
      'Squared sample spread computed with denominator n minus one.',
      r`$s^2=\sum_i(x_i-\bar x)^2/(n-1)$ for $n\ge2$.`,
      r`For data $1,2,3$, $s^2=1$.`,
      `The empirical-distribution variance uses denominator $n$, a different convention.`,
    ),
  ],
);
s3.questions = [
  q(r`Find the range of $2,4,4,9$.`, r`$9-2=7$.`, exact('7')),
  q(
    r`For data $1,2,3$, find the sample variance with denominator $n-1$.`,
    r`The mean is two and squared deviations sum to two; $s^2=2/2=1$.`,
    exact('1'),
  ),
  q(
    r`For data $1,2,3$, find the variance of the empirical distribution assigning probability $1/3$ to each observation.`,
    r`Divide the squared-deviation sum two by three, giving $2/3$.`,
    exact('2/3'),
  ),
  q(
    r`Find the sample variance of $2,4,6$ using denominator $n-1$.`,
    r`The mean is four and squared deviations sum to eight; $s^2=8/2=4$.`,
    exact('4'),
  ),
  q(
    r`Find the sample standard deviation of $2,4,6$ using denominator $n-1$ for variance.`,
    r`The sample variance is four, so standard deviation is $2$.`,
    exact('2'),
  ),
  q(
    r`For $n=5$, the sum of squared deviations from the sample mean is twenty. Find $s^2$.`,
    r`$20/(5-1)=5$.`,
    exact('5'),
  ),
  q(
    r`Every observation is increased by ten. The original sample variance is seven. Find the new sample variance.`,
    r`Translation does not change centered deviations, so the variance remains $7$.`,
    exact('7'),
  ),
  q(
    r`Every observation is multiplied by $-3$. The original sample standard deviation is two. Find the new standard deviation.`,
    r`$|-3|\cdot2=6$.`,
    exact('6'),
  ),
  q(
    r`Explain why the usual sample variance with denominator $n-1$ is undefined for one observation.`,
    r`The denominator is zero and one observed value supplies no within-sample variation around an independently estimated center. This is different from declaring the unknown population variance to be zero.`,
  ),
  q(
    r`Show that deviations from a sample mean sum to zero.`,
    r`$\sum_i(x_i-\bar x)=\sum_i x_i-n\bar x=n\bar x-n\bar x=0$.`,
    undefined,
    'prove',
  ),
];
s3.review = [
  q(
    r`Find the sample variance of $0,2,4,6$ using denominator $n-1$.`,
    r`The mean is three; squared deviations total $9+1+1+9=20$, giving $20/3$.`,
    exact('20/3'),
  ),
  q(
    r`A sample has standard deviation five centimeters. Find its sample variance in squared millimeters.`,
    r`Five centimeters is fifty millimeters, so the variance is $50^2=2500$.`,
    exact('2500'),
  ),
  q(
    r`For $n=4$, $\sum x_i=12$ and $\sum x_i^2=50$. Find sample variance.`,
    r`The mean is three; the centered sum is $50-4(3^2)=14$. Thus $s^2=14/3$.`,
    exact('14/3'),
  ),
];
const s4 = section(
  'Connect the sampling design to the target population',
  r`A sampling design specifies how units enter the sample. In a simple random sample without replacement of size $n$ from $N$ units, every subset of size $n$ is equally likely. Each unit has inclusion probability $n/N$, but the inclusion events are dependent because selecting one unit changes the remaining choices. Random sampling does not mean every random mechanism is a simple random sample.

Stratified sampling partitions the population into meaningful groups and randomly samples within each group. This can ensure representation of small or heterogeneous groups. Population summaries must respect the group's population weights, especially if sampling fractions differ. Cluster sampling randomly selects groups and then observes units within the selected groups; observations from a shared cluster can resemble one another. Stratification samples across all defined strata, whereas cluster sampling typically includes only selected clusters.

Systematic sampling chooses a random starting point and then every $k$th unit in an ordered list. It can be convenient, but periodic structure in the list can align with the sampling interval. Convenience sampling uses readily available units without a defined probability design. A voluntary-response poll allows potential participants to select themselves, making response propensity a possible source of bias.

For an original stratified calculation, suppose a target population is $80\%$ desktop and $20\%$ mobile sessions, with mean response times two and five units. The population-weighted mean is $0.8(2)+0.2(5)=2.6$. Sampling equal numbers from the two groups and averaging all records without weights would instead target $3.5$. Equal allocation may be useful for learning about the smaller group, but the desired population summary still uses the actual population proportions.

A sampling frame is the accessible list from which selection occurs. Random selection from an incomplete frame cannot recover excluded groups automatically. Record the frame, selection probabilities, replacements, clustering, and nonresponse. Those details determine whether later independent-sampling formulas fit the data, require an approximation, or need a more specialized analysis.`,
  [sampling, definitions],
  [
    termEntry(
      'sampling-design',
      'Sampling design',
      'The rule determining which population units are observed.',
      'A probability sampling design uses specified random selection, such as simple random, stratified, or cluster sampling.',
      'Stratification samples within groups; cluster sampling selects groups.',
      'A large convenience sample does not become a probability sample merely by growing.',
    ),
    termEntry(
      'sampling-frame',
      'Sampling frame',
      'The accessible list or collection used to select units.',
      'Coverage of the target population depends on what the frame includes and excludes.',
      'An active-user list omits users who stopped using the service.',
      'Random selection within a frame does not repair missing coverage.',
    ),
  ],
);
s4.questions = [
  q(
    r`A simple random sample without replacement selects twenty of one hundred units. Find each unit's inclusion probability.`,
    r`By symmetry each unit has probability $20/100=1/5$ of inclusion.`,
    exact('1/5'),
  ),
  q(
    r`Randomly sample users separately from each subscription tier. Name the design: stratified, cluster, or convenience.`,
    `Stratified. Random sampling is carried out within each predefined tier.`,
    term('stratified', 'cluster'),
    'interpret',
  ),
  q(
    r`Randomly choose four offices and survey every employee in those offices. Name the design: stratified, cluster, or convenience.`,
    `Cluster. Offices are selected as groups and their members are observed.`,
    term('cluster', 'stratified', ['cluster sampling']),
    'interpret',
  ),
  q(
    r`After choosing a random start, inspect every fiftieth record. Name the design.`,
    `Systematic. The selection follows a fixed interval after a random start.`,
    term('systematic', 'convenience', ['systematic sampling']),
    'interpret',
  ),
  q(
    r`Survey the first thirty people who enter a nearby shop, without random selection. Name the design.`,
    `Convenience. Units are chosen for ease of access.`,
    term('convenience', 'stratified', ['convenience sampling']),
    'interpret',
  ),
  q(
    r`Population weights are $4/5,1/5$ and group means are two and five. Find the population-weighted mean.`,
    r`$(4/5)(2)+(1/5)(5)=13/5$.`,
    exact('13/5'),
  ),
  q(
    r`A population has groups of sizes six hundred and four hundred. Allocate a proportional stratified sample of fifty. Give the two group sample sizes in order.`,
    r`$50(600/1000)=30$ and $50(400/1000)=20$, giving $(30,20)$.`,
    tuple(['30', '20']),
  ),
  q(
    r`True or false: simple random sampling without replacement makes all sampled values independent.`,
    r`False. Sampling without replacement couples selections; independent-sampling formulas may require an approximation when the sampling fraction is small.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Explain a risk of selecting every seventh record from data arranged in a repeating seven-record cycle.`,
    r`The interval can repeatedly select the same position within each cycle, excluding other positions and distorting the sample relative to the whole population.`,
  ),
  q(
    r`A randomly sampled customer list excludes customers who left last month. Explain the implication for estimating satisfaction among all customers from last month.`,
    r`The frame misses former customers, whose satisfaction may differ. Random selection among remaining customers does not repair that coverage gap.`,
  ),
];
s4.review = [
  q(
    r`A simple random sample selects twelve of eighty units without replacement. Find one unit's inclusion probability.`,
    r`$12/80=3/20$.`,
    exact('3/20'),
  ),
  q(
    r`Population weights are $3/10,7/10$, with group means ten and twenty. Find the weighted mean.`,
    r`$(3/10)(10)+(7/10)(20)=17$.`,
    exact('17'),
  ),
  q(
    r`Select two schools at random and observe every pupil in those schools. Name the sampling design.`,
    `Cluster. Whole schools are selected as groups.`,
    term('cluster', 'stratified', ['cluster sampling']),
    'interpret',
  ),
];
const s5 = section(
  'Separate random error, systematic bias, and causal evidence',
  r`Two well-drawn samples need not give identical statistics. This variation from sample to sample is sampling error, not necessarily a mistake. Bias is a systematic distortion relative to the target quantity. Increasing sample size can reduce random error under suitable assumptions while leaving selection, measurement, or nonresponse bias intact. A precise answer to the wrong population question is still wrong for the intended purpose.

Missing values deserve a model, not automatic deletion. If the slowest requests are the ones that time out and fail to record duration, the mean of recorded durations targets completed recorded requests, not all attempts. If respondents differ systematically from nonrespondents, a survey response rate alone does not reveal the direction or size of bias. The unobserved values remain unknown; an analyst must state assumptions rather than invent them.

An observational study records naturally occurring exposures and outcomes. A randomized experiment assigns treatments by a chance process. Random assignment makes treatment groups comparable in distribution with respect to pretreatment factors; it does not guarantee exact balance in a finite sample or eliminate random variation. Random sampling helps justify generalization to a population, while random assignment helps identify treatment effects within a study. One does not substitute for the other.

In a software experiment, assigning users randomly to two interface versions and comparing a prespecified outcome is stronger evidence of an interface effect than comparing users who chose different versions. User experience could affect both their choice and their performance, creating confounding. Repeated measures on the same user should retain their pairing; treating them as unrelated observations discards useful structure and may misstate uncertainty.

Careful design also addresses treatment contamination, measurement consistency, and masking when feasible. Report what was measured, how units were selected or assigned, which records were excluded, and whether analyses were chosen after looking at outcomes. Protect participants and disclose limitations. Honest statistical reasoning separates what the data show directly from what additional design or modeling assumptions are needed to support a broader or causal claim.`,
  [design, sampling],
  [
    termEntry(
      'random-assignment',
      'Random assignment',
      'Use a chance process to assign treatments to study units.',
      'Assignment supports treatment comparisons by making pretreatment factors comparable in distribution.',
      'Randomly assigning interface versions differs from observing user-selected versions.',
      'Random assignment does not guarantee exact finite-sample balance or representative sampling.',
    ),
    termEntry(
      'selection-bias',
      'Selection bias',
      'Systematic distortion caused by which observations enter the data.',
      'Selection related to relevant outcomes can make the observed sample differ from the target population.',
      'Dropping unrecorded timeouts can underrepresent long request durations.',
      'More observations from the same biased mechanism need not fix the distortion.',
    ),
  ],
);
s5.questions = [
  q(
    r`Researchers record which interface users voluntarily choose and their completion times. Is this observational or experimental? Enter one word.`,
    `Observational. The researchers do not assign the interface treatment.`,
    term('observational', 'experimental'),
    'interpret',
  ),
  q(
    r`Researchers randomly assign interface versions and record completion times. Is this observational or experimental? Enter one word.`,
    `Experimental. The treatment is assigned by the researchers using randomization.`,
    term('experimental', 'observational'),
    'interpret',
  ),
  q(
    r`True or false: random assignment guarantees exactly equal average experience in the two treatment groups.`,
    r`False. Chance imbalance remains possible; randomization balances pretreatment factors in distribution.`,
    truth(false),
    'interpret',
  ),
  q(
    r`True or false: enlarging a voluntary-response sample necessarily removes selection bias.`,
    r`False. More responses can retain the same systematic relationship between participation and opinion.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Of one hundred attempted observations, twenty are missing. What fraction is missing?`,
    r`$20/100=1/5$.`,
    exact('1/5'),
  ),
  q(
    r`A survey receives sixty responses from two hundred invitations. Find the response rate.`,
    r`$60/200=3/10$.`,
    exact('3/10'),
  ),
  q(
    r`In an experiment, all forty participants try both interfaces. How many participant-level pairs are available?`,
    r`Each participant contributes one pair, so there are $40$ pairs.`,
    exact('40'),
  ),
  q(
    r`Explain why the average of recorded request durations can underestimate average duration of all attempts when only the longest attempts fail to record.`,
    r`The recording mechanism selectively removes large durations. The observed mean then summarizes a systematically faster subset; it does not include the missing long values.`,
  ),
  q(
    r`An observational comparison finds experienced users choose version A and complete tasks faster. Give a confounding explanation.`,
    r`Experience can affect both version choice and completion time. The observed association can therefore arise without version A causing the speed difference.`,
  ),
  q(
    r`Design a basic interface comparison that separates random assignment from population sampling.`,
    r`Define the target users and sample them by an appropriate method, then randomly assign sampled users to versions. Use consistent measurement and a prespecified outcome. State that assignment supports the treatment comparison and sampling supports generalization; each has a separate role.`,
    undefined,
    'construct',
  ),
];
s5.review = [
  q(
    r`A sample has eight missing observations out of sixty-four attempts. Find the missing fraction.`,
    r`$8/64=1/8$.`,
    exact('1/8'),
  ),
  q(
    r`True or false: randomly assigning a convenience sample to treatments automatically makes the participants representative of the entire population.`,
    r`False. Assignment changes treatment allocation, not how participants entered the sample.`,
    truth(false),
    'interpret',
  ),
  q(
    r`Give one reason why repeated readings from the same device should not automatically be treated as independent observations.`,
    r`The readings share device-specific conditions or calibration errors. That shared component can induce dependence even when the timestamps differ.`,
  ),
];
s5.quickCheck = quick(
  r`Which statement correctly separates random sampling from random assignment?`,
  [
    `Sampling selects units; assignment allocates treatments.`,
    `They are two names for the same procedure.`,
    `Assignment guarantees population representativeness.`,
  ],
  0,
  `Selection and treatment allocation answer different design questions.`,
  [
    `Correct. Sampling addresses who is observed, while assignment addresses which treatment each observed unit receives.`,
    `The procedures act at different stages and can occur separately in a study.`,
    `Assignment does not change a sample's coverage or selection mechanism, so it cannot guarantee representativeness.`,
  ],
);
export default lesson(
  14,
  'data-samples-study-design',
  'Data, Samples, and Study Design',
  r`Before applying inference formulas, identify what the data represent and how they were collected. We connect numerical summaries to their target quantities, distinguish observations from independent units, and examine what sampling and treatment assignment can justify.`,
  [s1, s2, s3, s4, s5],
);
