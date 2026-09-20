import { r, source, term, n, e, o, qc } from './integration-helpers.mjs';
const area = source(
  2,
  2,
  1,
  'Areas between Curves',
  'Vertical and horizontal slices, curve intersections, and compound regions.',
);
const average = source(1, 5, 2, 'The Definite Integral', 'Average value and integral bounds.');
const volume = source(
  2,
  2,
  2,
  'Determining Volumes by Slicing',
  'Cross-sectional area, disks, and washers.',
);
const physical = source(
  2,
  2,
  5,
  'Physical Applications',
  'Mass from linear density, work, and lifting variable contributions.',
);
const net = source(
  1,
  5,
  4,
  'Integration Formulas and the Net Change Theorem',
  'Accumulating a derivative and displacement versus distance.',
);
export default {
  number: 12,
  slug: 'calculus-applications-integration',
  title: 'Applications of Integration',
  intro: r`The difficult part of an application is often constructing the integral, not evaluating it. Begin with a small representative piece: a strip of area, a slice of volume, a short segment of wire, or a small displacement under force. Express that piece with units, sum the pieces, and take the limit. This lesson develops that modeling habit across several settings, including average performance and accumulated resource use.`,
  sections: [
    {
      title: 'Area between curves',
      sources: [area],
      terms: [
        term(
          'area-between-curves',
          'Area between curves',
          'Integrate the nonnegative separation of the boundaries.',
          r`If $f\ge g$ on $[a,b]$, then $A=\int_a^b[f(x)-g(x)]\,dx$. Split where their order changes.`,
          r`Between $y=x$ and $y=x^2$ on $[0,1]$, the area is $1/6$.`,
          'Taking the absolute value after integration can lose area through cancellation.',
        ),
      ],
      body: r`A vertical strip between two graphs has height “upper minus lower” and width $\Delta x$. If $f(x)\ge g(x)$ on $[a,b]$, adding these strips gives $A=\int_a^b[f(x)-g(x)]\,dx$. The coordinates of the two curves can both be negative; their difference is still the strip's positive height. Area depends on separation, not distance from the horizontal axis.

For the region enclosed by $y=x$ and $y=x^2$, first solve $x=x^2$ to obtain intersections $0$ and $1$. Between them, $x\ge x^2$. Hence $A=\int_0^1(x-x^2)\,dx=[x^2/2-x^3/3]_0^1=1/6$. Solving intersections supplied the bounds, and a test point or factorization supplied the ordering. Neither should be guessed from a suggestive sketch alone.

If curves exchange order, split the interval. Between $y=x$ and $y=-x$ on $[-1,1]$, the upper function is $-x$ on the left and $x$ on the right. Thus $A=\int_{-1}^0(-2x)\,dx+\int_0^1(2x)\,dx=2$. Integrating $x-(-x)$ across the whole interval would give zero signed separation, losing both regions through cancellation. Equivalently, integrate the absolute separation $|f-g|$ after locating its sign changes.

Horizontal strips can simplify boundaries that are naturally functions of $y$. The strip width is “right minus left,” and its thickness is $dy$. For $x=y^2$ and $x=2-y$ between $y=-2$ and $y=1$, the right boundary is $2-y$, so $A=\int_{-2}^1(2-y-y^2)\,dy=9/2$. Vertical slicing would require solving branches and may introduce extra pieces.

Choose a slicing direction that gives a single understandable representative strip. Write the two boundary values explicitly and check that their difference is nonnegative throughout each part. The integral's units are length times length, or square units. A negative area indicates an ordering or orientation error; taking its absolute value is only legitimate when the same ordering was reversed consistently everywhere.`,
      questions: [
        n(
          r`Find the area between $y=x$ and $y=x^2$ on $[0,1]$.`,
          '1/6',
          r`Integrate upper minus lower: $\int_0^1(x-x^2)dx=1/2-1/3=1/6$.`,
        ),
        n(
          r`Find the enclosed area between $y=4$ and $y=x^2$.`,
          '32/3',
          r`Intersections are $x=\pm2$. The area is $\int_{-2}^2(4-x^2)dx=16-16/3=32/3$.`,
        ),
        n(
          r`Find the area between $y=x$ and $y=-x$ on $[-1,1]$.`,
          '2',
          r`The separation is $2|x|$, so the two equal triangular contributions total $2$.`,
        ),
        n(
          r`Find the area between $y=-1$ and $y=-3$ on $[2,5]$.`,
          '6',
          r`The upper-minus-lower height is $-1-(-3)=2$; multiply by width $3$.`,
        ),
        n(
          r`Find the enclosed area between $x=y^2$ and $x=2-y$.`,
          '9/2',
          r`Solve $y^2=2-y$ for $y=-2,1$. Then $\int_{-2}^1(2-y-y^2)dy=9/2$.`,
        ),
        n(
          r`Find the area between $y=\sin x$ and the axis on $[0,\pi]$.`,
          '2',
          r`Sine is nonnegative there, so the area is $[-\cos x]_0^\pi=2$.`,
        ),
        e(
          r`For the region between $y=2x$ and $y=x^2$ on $[0,2]$, give the vertical strip height.`,
          '2*x-x^2',
          r`The line lies above the parabola on the interval, so height is $2x-x^2$.`,
        ),
        n(
          r`Find the area between $y=2x$ and $y=x^2$ on $[0,2]$.`,
          '4/3',
          r`$\int_0^2(2x-x^2)dx=[x^2-x^3/3]_0^2=4/3$.`,
        ),
        o(
          r`Explain why $|\int_a^b(f-g)|$ need not equal the total area between the curves.`,
          r`If the curves cross, positive and negative separations cancel before the absolute value is taken. The example $f=x,g=-x$ on $[-1,1]$ gives zero by that expression but true area $2$.`,
        ),
        o(
          r`Describe a complete setup procedure for an area bounded by two curves when no bounds are supplied.`,
          r`Solve their intersection equations, identify which bounded region is intended, choose a slicing direction, determine upper/lower or right/left ordering on each segment, and integrate the nonnegative separation. A sketch helps identify components but algebra checks the bounds.`,
          'interpret',
        ),
      ],
      review: [
        n(
          r`Find the area between $y=3x$ and $y=x^2$ on $[0,3]$.`,
          '9/2',
          r`The area is $\int_0^3(3x-x^2)dx=27/2-9=9/2$.`,
        ),
        n(
          r`Find the area between $x=0$ and $x=1-y^2$ for $-1\le y\le1$.`,
          '4/3',
          r`Horizontal widths are $1-y^2$, so the integral is $[y-y^3/3]_{-1}^1=4/3$.`,
        ),
        o(
          r`Both boundary functions are below the horizontal axis. Explain how to form their area integral.`,
          r`Use the larger function value minus the smaller one, regardless of both being negative. This is their geometric separation; no separate reflection across the axis is needed.`,
        ),
      ],
      quickCheck: qc(
        r`When two curves exchange which is on top, how should total area be computed?`,
        [
          'Subtract once over the whole interval, then take an absolute value',
          'Split at the exchange and use upper minus lower on each piece',
        ],
        1,
        r`Splitting prevents positive and negative separations from cancelling.`,
      ),
    },
    {
      title: 'Average value and representative levels',
      sources: [average],
      terms: [
        term(
          'function-average',
          'Average value of a function',
          'Total accumulation divided by interval length.',
          r`For $a<b$, $f_{\mathrm{avg}}=(b-a)^{-1}\int_a^b f(x)\,dx$.`,
          r`The average of $x^2$ on $[0,3]$ is $3$.`,
          'The average of endpoint values is generally not the average of a nonlinear function.',
        ),
      ],
      body: r`For equally weighted numbers, an average divides their sum by their count. For a continuously varying function, the analogous average divides its total accumulation by interval length: $f_{\mathrm{avg}}=\frac1{b-a}\int_a^b f(x)\,dx$. This is the constant height that would produce the same signed integral over the same interval. Its units are the units of $f$, because the integration-variable units cancel after division.

For $f(t)=t^2$ on $[0,3]$, the integral is $[t^3/3]_0^3=9$, and the average is $9/3=3$. Averaging the endpoint values instead gives $(0+9)/2=9/2$, which is wrong. The endpoint average happens to work for a linear function because its trapezoidal area is exactly width times the average of the parallel sides. Curvature breaks that shortcut.

If $f$ is continuous, it attains its average somewhere in the interval. Indeed, the integral bounds put the average between the minimum and maximum values, and the intermediate value theorem supplies a point $c$ with $f(c)=f_{\mathrm{avg}}$. For the quadratic example, $c^2=3$, so the point in $[0,3]$ is $c=\sqrt3$. There may be several such points; the theorem promises existence, not uniqueness or the midpoint.

Average velocity and average speed differ. Average velocity is displacement divided by elapsed time, while average speed is total distance divided by elapsed time. For velocity $v(t)=t-1$ on $[0,2]$, the signed integral is zero but the absolute-value integral is $1$. Thus average velocity is zero and average speed is $1/2$. A return to the starting point can coexist with sustained motion.

In computing examples, the same distinction separates average resource rate from total resource consumption. An average power of $4$ watts over $3$ hours corresponds to $12$ watt-hours, but says nothing about the maximum instantaneous power. If measurements are unequally spaced, approximate the integral with time-weighted contributions before dividing by the total duration. A mean over samples is an average over the sampling distribution, which need not be the desired average over time.`,
      questions: [
        n(r`Find the average of $x^2$ on $[0,3]$.`, '3', r`$\frac13\int_0^3x^2dx=9/3=3$.`),
        n(
          r`Find the average of $2x+1$ on $[1,4]$.`,
          '6',
          r`The integral is $[x^2+x]_1^4=18$; divide by length $3$.`,
        ),
        n(
          r`Find the average of $\sin x$ on $[0,\pi]$.`,
          '2/pi',
          r`Its integral is $2$, and the interval length is $\pi$.`,
        ),
        n(
          r`Find the average of $e^x$ on $[0,1]$.`,
          'e-1',
          r`The interval length is $1$, so the average equals the integral $e-1$.`,
        ),
        n(
          r`Find the point $c\in[0,2]$ where $f(x)=x^2$ equals its average.`,
          '2/sqrt(3)',
          r`The average is $(1/2)(8/3)=4/3$. Solve $c^2=4/3$ and choose the nonnegative root $2/\sqrt3$.`,
        ),
        n(
          r`For $v(t)=t-1$ on $[0,2]$, find average velocity.`,
          '0',
          r`The negative and positive triangular contributions cancel, so displacement and average velocity are zero.`,
        ),
        n(
          r`For $v(t)=t-1$ on $[0,2]$, find average speed.`,
          '1/2',
          r`Total distance is $1$ and elapsed time is $2$, giving $1/2$.`,
        ),
        n(
          r`A process uses $18$ joules during $6$ seconds. Find average power in watts.`,
          '3',
          r`Average rate is total energy divided by time: $18/6=3$ watts.`,
        ),
        o(
          r`Explain why a continuous function must attain its average value on a closed interval.`,
          r`If $m$ and $M$ are its minimum and maximum, integral bounds give $m\le f_{avg}\le M$. Continuity and the intermediate value theorem then supply a point taking that value.`,
          'prove',
        ),
        o(
          r`Give a continuous function for which more than one point attains its average on $[-1,1]$.`,
          r`For $f(x)=x^2$, the average is $1/3$, attained at both $x=1/\sqrt3$ and $x=-1/\sqrt3$. Existence does not imply uniqueness.`,
          'construct',
        ),
      ],
      review: [
        n(
          r`Find the average of $3x^2$ on $[-1,1]$.`,
          '1',
          r`The integral is $[x^3]_{-1}^1=2$, divided by interval length $2$.`,
        ),
        n(
          r`Power is $2$ watts for $1$ hour and $5$ watts for $3$ hours. Find time-average power.`,
          '17/4',
          r`Energy is $2(1)+5(3)=17$ watt-hours over $4$ hours, so average power is $17/4$ watts.`,
        ),
        o(
          r`Can an average temperature of $20$ degrees determine the maximum temperature? Explain.`,
          r`No. The average fixes the integral relative to duration, while many different profiles can have that same area and different peaks. Additional shape or bound information is necessary.`,
          'interpret',
        ),
      ],
    },
    {
      title: 'Volumes from slices, disks, and washers',
      sources: [volume],
      terms: [
        term(
          'cross-sectional-area',
          'Cross-sectional area',
          'The area of a slice perpendicular to a chosen axis.',
          r`A solid with slice area $A(x)$ on $[a,b]$ has volume $V=\int_a^b A(x)\,dx$.`,
          r`Circular slices of radius $x$ give area $\pi x^2$.`,
          'Integrate an area, not a radius or circumference, when adding thin volume slices.',
        ),
        term(
          'washer-method',
          'Washer method',
          'Subtract the inner disk area from the outer disk area.',
          r`A washer with radii $R\ge r\ge0$ has area $\pi(R^2-r^2)$.`,
          r`Radii $3$ and $1$ give area $8\pi$.`,
          r`The area is not $\pi(R-r)^2$.`,
        ),
      ],
      body: r`A thin slab with cross-sectional area $A(x)$ and thickness $\Delta x$ has approximate volume $A(x)\Delta x$. Summing parallel slices and taking a limit gives $V=\int_a^b A(x)\,dx$. Area times length produces cubic units. The cross-section need not be circular: square, triangular, and varying irregular sections all fit the same principle when their areas are known.

If the square cross-section at position $x\in[0,2]$ has side $x+1$, then $A(x)=(x+1)^2$. Its volume is $\int_0^2(x+1)^2dx=[(x+1)^3/3]_0^2=26/3$. Integrating $x+1$ would add lengths instead of areas and yield the wrong units. Draw one slice and label its dimensions before choosing the integrand.

Rotating a region under a nonnegative radius function $r(x)$ about the horizontal axis creates circular slices, or disks. Their areas are $\pi r(x)^2$. Rotating the region $0\le y\le x$ for $0\le x\le2$ yields $V=\pi\int_0^2x^2dx=8\pi/3$. This is a cone of height $2$ and base radius $2$, which independently agrees with the geometric formula.

A hole creates washers. If the outer and inner distances from the rotation axis are $R(x)$ and $r(x)$, then $A(x)=\pi[R(x)^2-r(x)^2]$. Rotating the region between $y=2$ and $y=1$ on $[0,3]$ gives $V=\pi\int_0^3(4-1)dx=9\pi$. Squaring the difference of the radii would instead describe a different disk and underestimate the annulus.

Radii are distances from the actual axis, not automatically function values. Rotating $0\le y\le x$ on $[0,1]$ around $y=2$ gives outer radius $2$ and inner radius $2-x$, so the area is $\pi[4-(2-x)^2]$. If the region crosses the axis, first determine which parts overlap under rotation; blindly subtracting signed heights can double count. Our examples keep each slice's geometry explicit so the formula follows from the region.`,
      questions: [
        n(
          r`A solid has cross-sectional area $A(x)=x^2+1$ for $0\le x\le2$. Find volume.`,
          '14/3',
          r`$\int_0^2(x^2+1)dx=8/3+2=14/3$.`,
        ),
        n(
          r`Square slices have side $x+1$ for $0\le x\le2$. Find volume.`,
          '26/3',
          r`Integrate the squared side: $\int_0^2(x+1)^2dx=26/3$.`,
        ),
        n(
          r`Rotate the region $0\le y\le x$, $0\le x\le2$, about the horizontal axis. Find volume.`,
          '8*pi/3',
          r`Disk area is $\pi x^2$, so $V=\pi[x^3/3]_0^2=8\pi/3$.`,
        ),
        n(
          r`Rotate $0\le y\le\sqrt{x}$, $0\le x\le4$, about the horizontal axis. Find volume.`,
          '8*pi',
          r`Disk area is $\pi(\sqrt{x})^2=\pi x$, giving $\pi[x^2/2]_0^4=8\pi$.`,
        ),
        n(
          r`Washers have outer radius $3$ and inner radius $1$ along a length $2$. Find volume.`,
          '16*pi',
          r`Each area is $\pi(9-1)=8\pi$; multiply by length $2$.`,
        ),
        n(
          r`Rotate the region between $y=2$ and $y=x$ for $0\le x\le2$ about the horizontal axis. Find volume.`,
          '16*pi/3',
          r`Use $\pi\int_0^2(4-x^2)dx=\pi(8-8/3)=16\pi/3$.`,
        ),
        e(
          r`Rotate $0\le y\le x$ on $[0,1]$ about $y=2$. Give the washer area as a function of $x$.`,
          'pi*(4-(2-x)^2)',
          r`The farther edge is at distance $2$, the nearer at $2-x$, so subtract their squared-radius areas.`,
        ),
        n(
          r`For that rotation about $y=2$, find the volume.`,
          '5*pi/3',
          r`$\pi\int_0^1[4-(2-x)^2]dx=\pi\int_0^1(4x-x^2)dx=5\pi/3$.`,
        ),
        o(
          r`Explain why a washer area is $\pi(R^2-r^2)$ rather than $\pi(R-r)^2$.`,
          r`A washer is the outer disk with the inner disk removed, so their areas subtract. Squaring the radial thickness gives the area of a different disk. For $R=2,r=1$, the true area is $3\pi$, not $\pi$.`,
        ),
        o(
          r`Derive the cone volume formula from slices for height $h$ and base radius $R$.`,
          r`Measure $x$ from the tip. Similar triangles give radius $Rx/h$. Integrating $\pi R^2x^2/h^2$ from $0$ to $h$ yields $\pi R^2h/3$.`,
          'prove',
        ),
      ],
      review: [
        n(
          r`Rotate $0\le y\le x^2$ on $[0,1]$ about the horizontal axis. Find volume.`,
          'pi/5',
          r`Square the radius to get disk area $\pi x^4$, whose integral is $\pi/5$.`,
        ),
        n(
          r`A solid has triangular slices with base $2x$ and height $3x$ for $0\le x\le1$. Find volume.`,
          '1',
          r`Slice area is $(1/2)(2x)(3x)=3x^2$, whose integral on $[0,1]$ is $1$.`,
        ),
        o(
          r`Why must changing the rotation axis change the radius formulas even when the bounding curves stay the same?`,
          r`A radius is the distance from the chosen axis to a boundary. Translating the axis changes those distances and therefore the squared areas, even though the original planar region has not moved.`,
        ),
      ],
      quickCheck: qc(
        r`A solid's slice is a square of side $s(x)$. What should be integrated for volume?`,
        [r`$s(x)$`, r`$s(x)^2$`, r`$4s(x)$`],
        1,
        r`The slice contributes area times thickness, and a square's area is the square of its side.`,
      ),
    },
    {
      title: 'Density and work from variable contributions',
      sources: [physical],
      terms: [
        term(
          'linear-density',
          'Linear density',
          'Mass per unit length.',
          r`A rod with density $\rho(x)$ has mass $m=\int_a^b\rho(x)\,dx$.`,
          r`Density $2+x$ g/cm on $[0,2]$ cm gives mass $6$ g.`,
          'Density and mass have different units.',
        ),
        term(
          'variable-force-work',
          'Work by a variable force',
          'Integrate the force component along displacement.',
          r`For a force along a line, $W=\int_a^bF(x)\,dx$.`,
          r`A spring with applied force $kx$ requires work $kb^2/2$ to stretch from $0$ to $b$.`,
          'Force times total distance is valid only for a constant force component.',
        ),
      ],
      body: r`A rod's density describes how much mass lies near a location. If $\rho(x)$ is measured in grams per centimeter, a short segment has mass approximately $\rho(x)\Delta x$. Thus $m=\int_a^b\rho(x)\,dx$. For a rod of length $2$ centimeters with density $2+x$, the mass is $[2x+x^2/2]_0^2=6$ grams. Using the initial density times total length would ignore the denser far end.

Work uses the same accumulation pattern. For a constant force component $F$ along a displacement $\Delta x$, work is $F\Delta x$. A variable force gives $W=\int_a^bF(x)\,dx$, measured in newton-meters, or joules. A force opposing positive displacement contributes negative work. When asking for the effort required to move something slowly against resistance, specify the applied force, which usually has the opposite sign from the restoring force.

For an ideal spring, the restoring force is $-kx$ when $x$ measures extension from natural length and $k>0$. The slowly applied stretching force is $kx$. Stretching from $0$ to $b$ requires $\int_0^bkx\,dx=kb^2/2$. If a force of $12$ newtons holds an extension of $0.3$ meters, then $k=40$ newtons per meter. Stretching from $0.1$ to $0.4$ meters requires $20(0.4^2-0.1^2)=3$ joules.

A lifting problem may vary the distance instead of the force density. Consider a uniform vertical rope of length $L$ and weight density $w$ newtons per meter, pulled onto a platform at its top. A small piece originally $y$ meters below the platform weighs approximately $w\,dy$ newtons and travels $y$ meters. Its work contribution is $wy\,dy$, so total work is $\int_0^Lwy\,dy=wL^2/2$.

This setup is more reliable than multiplying total rope weight by its full length: the bottom travels farthest, but the top travels almost no distance. The representative piece supplies both its own weight and its own distance. Neglecting friction, acceleration, and changes in material properties is part of this idealized model; those assumptions explain what physical quantity the calculation represents.`,
      questions: [
        n(
          r`A rod on $[0,3]$ cm has density $\rho(x)=1+2x$ g/cm. Find mass in grams.`,
          '12',
          r`$\int_0^3(1+2x)dx=[x+x^2]_0^3=12$ grams.`,
        ),
        n(
          r`Density is $3x^2$ kg/m on $[1,2]$ m. Find mass in kilograms.`,
          '7',
          r`$[x^3]_1^2=8-1=7$ kilograms.`,
        ),
        n(
          r`A force $F(x)=2x+1$ newtons moves an object from $x=0$ to $x=3$ meters. Find work in joules.`,
          '12',
          r`$W=[x^2+x]_0^3=12$ joules.`,
        ),
        n(
          r`A resisting force component is $-4$ newtons during displacement from $0$ to $5$ meters. Find its work.`,
          '-20',
          r`$W=\int_0^5-4dx=-20$ joules; the force opposes displacement.`,
        ),
        n(
          r`A spring needs $15$ newtons at extension $0.3$ meters. Find its spring constant in newtons/meter.`,
          '50',
          r`$k=F/x=15/0.3=50$.`,
        ),
        n(
          r`For spring constant $50$ N/m, find work to stretch from $0$ to $0.2$ meters.`,
          '1',
          r`$W=50(0.2)^2/2=1$ joule.`,
        ),
        n(
          r`For spring constant $40$ N/m, find work to stretch from $0.1$ to $0.4$ meters.`,
          '3',
          r`$W=20[(0.4)^2-(0.1)^2]=20(0.15)=3$ joules.`,
        ),
        n(
          r`A rope of length $6$ m weighs $2$ N/m. Find ideal work to pull it onto its top platform.`,
          '36',
          r`$\int_0^6 2y\,dy=[y^2]_0^6=36$ joules.`,
        ),
        o(
          r`Why is total rope weight times full rope length not the correct lifting work when pulling the rope onto its top platform?`,
          r`Different pieces travel different distances. Only the bottom travels the full length; the top travels essentially zero. Summing each piece's weight times its own distance gives $wL^2/2$, half of the naive $wL^2$ for a uniform rope.`,
        ),
        o(
          r`Distinguish the spring's restoring-force work from the applied work when slowly stretching it from $0$ to $b$.`,
          r`The restoring force is $-kx$ and does work $-kb^2/2$. The balancing applied force is $kx$ and does work $kb^2/2$. They have opposite signs because the two forces point in opposite directions.`,
          'interpret',
        ),
      ],
      review: [
        n(
          r`A rod of length $4$ cm has density $2+x/2$ g/cm. Find its mass.`,
          '12',
          r`$[2x+x^2/4]_0^4=8+4=12$ grams.`,
        ),
        n(
          r`An ideal spring has $k=20$ N/m. Find applied work from extension $1$ to $2$ meters.`,
          '30',
          r`$W=10(2^2-1^2)=30$ joules.`,
        ),
        n(
          r`A uniform rope is $4$ m long and weighs $3$ N/m. Find work to pull it onto its top platform.`,
          '24',
          r`$W=\int_0^4 3y\,dy=3(16)/2=24$ joules.`,
        ),
      ],
    },
    {
      title: 'Net change and model interpretation',
      sources: [net, physical, average],
      terms: [
        term(
          'accumulation-model',
          'Accumulation model',
          'A whole quantity built from local contributions and an initial level.',
          r`For a rate $r$, $Q(t)=Q(a)+\int_a^t r(s)\,ds$, while a density model integrates local amount per unit length or volume.`,
          r`A queue's fluid model uses arrivals minus service as its net rate while the queue remains positive.`,
          'A continuous model may stop applying when a physical or discrete boundary is reached.',
        ),
      ],
      body: r`Many applications share the formula “final amount equals initial amount plus accumulated net rate.” If a storage system receives data at rate $r_{in}(t)$ and removes it at rate $r_{out}(t)$, then its content changes by $\int[r_{in}(t)-r_{out}(t)]dt$. The integral of input alone measures total arrivals, not retained content. Define the quantity before choosing the sign.

Suppose a buffer begins with $10$ megabytes, input is $4+t$ megabytes per second, and output is $6$ megabytes per second for $0\le t\le3$. Its net rate is $t-2$, so $Q(t)=10+t^2/2-2t$. At $t=3$, $Q=17/2$ megabytes. The minimum occurs when the net rate changes from negative to positive at $t=2$, giving $Q(2)=8$. The model never predicts an empty buffer in the stated interval, so the assumed service rate is internally consistent.

If the initial amount were only $1$ megabyte, the same rate formula would eventually predict negative content. A real buffer cannot serve unavailable data. The first time $Q(t)=0$ marks a boundary where the output model must change. Calculus identifies that boundary; it does not justify continuing an impossible negative inventory. The same care applies to empty tanks, finite battery capacity, and continuous approximations to discrete counts.

A motion example combines net and total change. Let $v(t)=t^2-1$ on $[0,2]$. The displacement is $[t^3/3-t]_0^2=2/3$. Velocity changes sign at $t=1$, so distance is $-\int_0^1v+\int_1^2v=2/3+4/3=2$. The antiderivative alone is insufficient for distance until the sign intervals have been identified.

When communicating an applied result, state the quantity, units, interval, and model assumptions in a sentence. A bare number like $2/3$ could mean displacement, average rate, or an approximation error. Describe exactness accurately: integrating an explicitly assumed rate formula gives an exact result for that model, while measured rates generally lead to estimates. This distinction allows the mathematics to be precise without claiming unrealistic certainty about the underlying system.`,
      questions: [
        n(
          r`A buffer begins at $10$ MB with input $4+t$ and output $6$ MB/s for $0\le t\le3$. Find content at $t=3$.`,
          '17/2',
          r`$Q(3)=10+\int_0^3(t-2)dt=10+9/2-6=17/2$ MB.`,
        ),
        n(
          r`For that buffer, find the minimum content on $[0,3]$.`,
          '8',
          r`$Q'=t-2$ changes from negative to positive at $t=2$; $Q(2)=10+2-4=8$ MB.`,
        ),
        n(r`Find displacement for $v(t)=t^2-1$ on $[0,2]$.`, '2/3', r`$[t^3/3-t]_0^2=8/3-2=2/3$.`),
        n(
          r`Find distance for $v(t)=t^2-1$ on $[0,2]$.`,
          '2',
          r`Split at $t=1$: the negative part has magnitude $2/3$ and the positive part is $4/3$, totaling $2$.`,
        ),
        n(
          r`A stock begins with $7$ units and has net rate $-2$ units/hour. When does the continuous model first reach zero?`,
          '7/2',
          r`Solve $7-2t=0$, giving $t=7/2$ hours.`,
        ),
        n(
          r`Power is $P(t)=3+t$ watts for $0\le t\le4$ seconds. Find energy in joules.`,
          '20',
          r`$\int_0^4(3+t)dt=12+8=20$ joules.`,
        ),
        n(
          r`For $P(t)=3+t$ on $[0,4]$, find average power in watts.`,
          '5',
          r`Energy $20$ joules divided by $4$ seconds gives $5$ watts.`,
        ),
        e(
          r`A quantity begins at $5$ and has rate $2t-3$. Give $Q(t)$ under this model.`,
          '5+t^2-3*t',
          r`$Q(t)=5+\int_0^t(2s-3)ds=5+t^2-3t$.`,
          ['t'],
        ),
        o(
          r`A tank model predicts negative volume after some time. Explain what conclusion should replace that prediction.`,
          r`The assumptions have ceased to describe the physical tank at or before the first zero. Outflow cannot continue unchanged without available fluid. Report the first emptying time and revise the model beyond it rather than interpreting negative volume literally.`,
        ),
        o(
          r`Explain the difference between exact integration of a fitted rate curve and exact knowledge of a real accumulated quantity.`,
          r`The integral can be exact for the fitted mathematical function while the function itself only approximates real measurements. Model error, measurement error, and unsampled behavior remain even if the symbolic integration has no computational error.`,
          'interpret',
        ),
      ],
      review: [
        n(
          r`A reservoir starts at $20$ liters with net rate $3-2t$ liters/minute. Find its amount at $t=2$.`,
          '22',
          r`$20+[3t-t^2]_0^2=20+6-4=22$ liters.`,
        ),
        n(
          r`For $v(t)=2t-2$ on $[0,3]$, find total distance.`,
          '5',
          r`Split at $1$. The negative triangular contribution has magnitude $1$ and the positive one is $4$, totaling $5$.`,
        ),
        o(
          r`Why is integrating arrival rate insufficient to predict queue size?`,
          r`Queue size depends on departures as well as arrivals and on the initial queue. A continuous model integrates arrival minus service while respecting the nonnegative queue boundary.`,
          'interpret',
        ),
      ],
    },
  ],
};
