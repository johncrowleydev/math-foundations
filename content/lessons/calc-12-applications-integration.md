# Applications of Integration

The difficult part of an application is often constructing the integral, not evaluating it. Begin with a small representative piece: a strip of area, a slice of volume, a short segment of wire, or a small displacement under force. Express that piece with units, sum the pieces, and take the limit. This lesson develops that modeling habit across several settings, including average performance and accumulated resource use.

## Area between curves

A vertical strip between two graphs has height “upper minus lower” and width $\Delta x$. If $f(x)\ge g(x)$ on $[a,b]$, adding these strips gives $A=\int_a^b[f(x)-g(x)]\,dx$. The coordinates of the two curves can both be negative; their difference is still the strip's positive height. Area depends on separation, not distance from the horizontal axis.

For the region enclosed by $y=x$ and $y=x^2$, first solve $x=x^2$ to obtain intersections $0$ and $1$. Between them, $x\ge x^2$. Hence $A=\int_0^1(x-x^2)\,dx=[x^2/2-x^3/3]_0^1=1/6$. Solving intersections supplied the bounds, and a test point or factorization supplied the ordering. Neither should be guessed from a suggestive sketch alone.

If curves exchange order, split the interval. Between $y=x$ and $y=-x$ on $[-1,1]$, the upper function is $-x$ on the left and $x$ on the right. Thus $A=\int_{-1}^0(-2x)\,dx+\int_0^1(2x)\,dx=2$. Integrating $x-(-x)$ across the whole interval would give zero signed separation, losing both regions through cancellation. Equivalently, integrate the absolute separation $|f-g|$ after locating its sign changes.

Horizontal strips can simplify boundaries that are naturally functions of $y$. The strip width is “right minus left,” and its thickness is $dy$. For $x=y^2$ and $x=2-y$ between $y=-2$ and $y=1$, the right boundary is $2-y$, so $A=\int_{-2}^1(2-y-y^2)\,dy=9/2$. Vertical slicing would require solving branches and may introduce extra pieces.

Choose a slicing direction that gives a single understandable representative strip. Write the two boundary values explicitly and check that their difference is nonnegative throughout each part. The integral's units are length times length, or square units. A negative area indicates an ordering or orientation error; taking its absolute value is only legitimate when the same ordering was reversed consistently everywhere.

Related definitions: [Area between curves](ref:calculus-area-between-curves).

## Average value and representative levels

For equally weighted numbers, an average divides their sum by their count. For a continuously varying function, the analogous average divides its total accumulation by interval length: $f_{\mathrm{avg}}=\frac1{b-a}\int_a^b f(x)\,dx$. This is the constant height that would produce the same signed integral over the same interval. Its units are the units of $f$, because the integration-variable units cancel after division.

For $f(t)=t^2$ on $[0,3]$, the integral is $[t^3/3]_0^3=9$, and the average is $9/3=3$. Averaging the endpoint values instead gives $(0+9)/2=9/2$, which is wrong. The endpoint average happens to work for a linear function because its trapezoidal area is exactly width times the average of the parallel sides. Curvature breaks that shortcut.

If $f$ is continuous, it attains its average somewhere in the interval. Indeed, the integral bounds put the average between the minimum and maximum values, and the intermediate value theorem supplies a point $c$ with $f(c)=f_{\mathrm{avg}}$. For the quadratic example, $c^2=3$, so the point in $[0,3]$ is $c=\sqrt3$. There may be several such points; the theorem promises existence, not uniqueness or the midpoint.

Average velocity and average speed differ. Average velocity is displacement divided by elapsed time, while average speed is total distance divided by elapsed time. For velocity $v(t)=t-1$ on $[0,2]$, the signed integral is zero but the absolute-value integral is $1$. Thus average velocity is zero and average speed is $1/2$. A return to the starting point can coexist with sustained motion.

In computing examples, the same distinction separates average resource rate from total resource consumption. An average power of $4$ watts over $3$ hours corresponds to $12$ watt-hours, but says nothing about the maximum instantaneous power. If measurements are unequally spaced, approximate the integral with time-weighted contributions before dividing by the total duration. A mean over samples is an average over the sampling distribution, which need not be the desired average over time.

Related definitions: [Average value of a function](ref:calculus-function-average).

## Volumes from slices, disks, and washers

A thin slab with cross-sectional area $A(x)$ and thickness $\Delta x$ has approximate volume $A(x)\Delta x$. Summing parallel slices and taking a limit gives $V=\int_a^b A(x)\,dx$. Area times length produces cubic units. The cross-section need not be circular: square, triangular, and varying irregular sections all fit the same principle when their areas are known.

If the square cross-section at position $x\in[0,2]$ has side $x+1$, then $A(x)=(x+1)^2$. Its volume is $\int_0^2(x+1)^2dx=[(x+1)^3/3]_0^2=26/3$. Integrating $x+1$ would add lengths instead of areas and yield the wrong units. Draw one slice and label its dimensions before choosing the integrand.

Rotating a region under a nonnegative radius function $r(x)$ about the horizontal axis creates circular slices, or disks. Their areas are $\pi r(x)^2$. Rotating the region $0\le y\le x$ for $0\le x\le2$ yields $V=\pi\int_0^2x^2dx=8\pi/3$. This is a cone of height $2$ and base radius $2$, which independently agrees with the geometric formula.

A hole creates washers. If the outer and inner distances from the rotation axis are $R(x)$ and $r(x)$, then $A(x)=\pi[R(x)^2-r(x)^2]$. Rotating the region between $y=2$ and $y=1$ on $[0,3]$ gives $V=\pi\int_0^3(4-1)dx=9\pi$. Squaring the difference of the radii would instead describe a different disk and underestimate the annulus.

Radii are distances from the actual axis, not automatically function values. Rotating $0\le y\le x$ on $[0,1]$ around $y=2$ gives outer radius $2$ and inner radius $2-x$, so the area is $\pi[4-(2-x)^2]$. If the region crosses the axis, first determine which parts overlap under rotation; blindly subtracting signed heights can double count. Our examples keep each slice's geometry explicit so the formula follows from the region.

Related definitions: [Cross-sectional area](ref:calculus-cross-sectional-area); [Washer method](ref:calculus-washer-method).

## Density and work from variable contributions

A rod's density describes how much mass lies near a location. If $\rho(x)$ is measured in grams per centimeter, a short segment has mass approximately $\rho(x)\Delta x$. Thus $m=\int_a^b\rho(x)\,dx$. For a rod of length $2$ centimeters with density $2+x$, the mass is $[2x+x^2/2]_0^2=6$ grams. Using the initial density times total length would ignore the denser far end.

Work uses the same accumulation pattern. For a constant force component $F$ along a displacement $\Delta x$, work is $F\Delta x$. A variable force gives $W=\int_a^bF(x)\,dx$, measured in newton-meters, or joules. A force opposing positive displacement contributes negative work. When asking for the effort required to move something slowly against resistance, specify the applied force, which usually has the opposite sign from the restoring force.

For an ideal spring, the restoring force is $-kx$ when $x$ measures extension from natural length and $k>0$. The slowly applied stretching force is $kx$. Stretching from $0$ to $b$ requires $\int_0^bkx\,dx=kb^2/2$. If a force of $12$ newtons holds an extension of $0.3$ meters, then $k=40$ newtons per meter. Stretching from $0.1$ to $0.4$ meters requires $20(0.4^2-0.1^2)=3$ joules.

A lifting problem may vary the distance instead of the force density. Consider a uniform vertical rope of length $L$ and weight density $w$ newtons per meter, pulled onto a platform at its top. A small piece originally $y$ meters below the platform weighs approximately $w\,dy$ newtons and travels $y$ meters. Its work contribution is $wy\,dy$, so total work is $\int_0^Lwy\,dy=wL^2/2$.

This setup is more reliable than multiplying total rope weight by its full length: the bottom travels farthest, but the top travels almost no distance. The representative piece supplies both its own weight and its own distance. Neglecting friction, acceleration, and changes in material properties is part of this idealized model; those assumptions explain what physical quantity the calculation represents.

Related definitions: [Linear density](ref:calculus-linear-density); [Work by a variable force](ref:calculus-variable-force-work).

## Net change and model interpretation

Many applications share the formula “final amount equals initial amount plus accumulated net rate.” If a storage system receives data at rate $r_{in}(t)$ and removes it at rate $r_{out}(t)$, then its content changes by $\int[r_{in}(t)-r_{out}(t)]dt$. The integral of input alone measures total arrivals, not retained content. Define the quantity before choosing the sign.

Suppose a buffer begins with $10$ megabytes, input is $4+t$ megabytes per second, and output is $6$ megabytes per second for $0\le t\le3$. Its net rate is $t-2$, so $Q(t)=10+t^2/2-2t$. At $t=3$, $Q=17/2$ megabytes. The minimum occurs when the net rate changes from negative to positive at $t=2$, giving $Q(2)=8$. The model never predicts an empty buffer in the stated interval, so the assumed service rate is internally consistent.

If the initial amount were only $1$ megabyte, the same rate formula would eventually predict negative content. A real buffer cannot serve unavailable data. The first time $Q(t)=0$ marks a boundary where the output model must change. Calculus identifies that boundary; it does not justify continuing an impossible negative inventory. The same care applies to empty tanks, finite battery capacity, and continuous approximations to discrete counts.

A motion example combines net and total change. Let $v(t)=t^2-1$ on $[0,2]$. The displacement is $[t^3/3-t]_0^2=2/3$. Velocity changes sign at $t=1$, so distance is $-\int_0^1v+\int_1^2v=2/3+4/3=2$. The antiderivative alone is insufficient for distance until the sign intervals have been identified.

When communicating an applied result, state the quantity, units, interval, and model assumptions in a sentence. A bare number like $2/3$ could mean displacement, average rate, or an approximation error. Describe exactness accurately: integrating an explicitly assumed rate formula gives an exact result for that model, while measured rates generally lead to estimates. This distinction allows the mathematics to be precise without claiming unrealistic certainty about the underlying system.

Related definitions: [Accumulation model](ref:calculus-accumulation-model).
