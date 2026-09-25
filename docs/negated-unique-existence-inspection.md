# Negated unique existence

The quantified-formula assessment for `proof-by-contradiction-6` rejected
`\neg(\exists!u\,S(u))` even though the instructions ask only for a quantified
negation. The parser already supports unique existence and the implicit integer
domain. Its structural normalization does not identify the resulting universal
formula with the separately quantified “no solutions or two distinct solutions”
answer.

Add `!exists! x in Z S(x)` through the assessment's existing `alternatives`
mechanism. This also accepts renamed variables, explicit or implicit integer
domains, TeX and Unicode notation, and the ordinary-quantifier expansion of
negated uniqueness. The original expected formula and displayed solution remain
valid. No general first-order equivalence solver or parser exception is added.

## Mathematical inspection

On September 24, 2026, reinspected Richard Hammack's _Book of Proof_, third
edition, [§7.3, printed p. 153](https://richardhammack.github.io/BookOfProof/Main.pdf#page=165)
on existence and uniqueness, and
[§2.10, printed pp. 60–62](https://richardhammack.github.io/BookOfProof/Main.pdf#page=72)
on negating quantified statements. The existing `p-existence` and `p-quantifiers`
citations cover the exercise's practice group.

Existence and uniqueness mean that the solution set has exactly one member.
Negating that assertion permits either zero members or two distinct members.
Neither disjunct alone expresses the full negation. The formula with one
unnegated unique-existence quantifier expresses the original assertion.

The added synthetic fixtures cover six accepted forms, five incorrect forms,
and an incorrect domain. Existing fixtures retain the expanded accepted answer,
the incomplete no-solutions answer, and the missing-field error. Both the
TypeScript content validator and the Go published-catalog suite execute all
15 cases. Browser coverage submits a synthetic TeX answer through the real local
API and captures the correct phone result.

## Published compatibility

Compared the candidate curriculum with a fresh build of `c1a3123`. Removing
the single new `alternatives` property restores the original notebook lessons
and complete grading catalog, apart from its content version. Question wording,
solutions, identities, placement, and all other grading contracts are unchanged.
The accepted-answer index changes its lookup key for this corrected contract.
Its answer value is unchanged.

Rechecked the original TeX inspection hash before replacing only this question's
hash. Recomputed its lesson source digest and the TeX catalog source digest from
the inspected candidate objects. Other source assignments and inspection records
remain unchanged. Published artifact updates preserve all original captured
hashes and previous inspection records. The deterministic coverage ledger changes
only its catalog version.

This content correction does not rewrite saved answers or assessment history.
Existing Review instances freeze their assessment, so Try again on an old
instance still uses its original contract. After deployment, the current exercise
at `/#/practice/proof-by-contradiction/6` and newly issued Review instances use the
corrected contract. Ending a Review session and starting focused practice issues
fresh instances without deleting earlier submissions.

## Production integration

PR #39 merged to `main` as `18d48ea`. Before activation, the live deployment
marker identified `98f71d7`, a manual release containing the historical
interpretation-coverage repairs. Those repairs were not on `main`. The automated
deployment was cancelled during its build, before SSH or release activation.

The production integration merges `18d48ea` into the deployed `98f71d7` history.
The only conflicts are published artifact pins and the coverage digest. Preserve
the deployed inspection history and record the combined artifacts separately.
Canonical content combines cleanly: the existing interpretation reviews remain,
and only the unique-existence assessment gains its accepted alternative.

Compare the combined catalog and notebook against copies from the active release,
then validate both affected browser suites and the published Go fixtures before
activation. Deploy the matching web, server, and catalog through the existing
backup-and-activation script, retaining its rollback record and recovery point.
