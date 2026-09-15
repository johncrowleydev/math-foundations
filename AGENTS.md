# Project instructions

- Never request, trigger, or rerun code review unless explicitly requested in the current user request.
- Use semantic branch prefixes; never agent/ or codex/ unless explicitly requested.
- The React/TypeScript PWA is the primary client. Preserve the compact responsive UI, URL routing, offline work, and existing handwriting compatibility. Android is retired.
- Inline exercises must follow required teaching concepts. Preserve lesson slugs, exercise IDs, grading history, and saved work.
- Every subject begins with a reading-only lesson numbered 00 and titled Introduction. Explain the subject, applications, prerequisites, learning journey, and how to study it. Introductions have no exercises or quick checks; numbering restarts within each subject without changing existing lesson slugs or exercise IDs.
- Shared content is generated into output/content; the grading catalog is output/grading-catalog.json.
- Every new or changed piece of learning content must cite credible, pinpoint sources in content/sources.json. Read and follow docs/content-sources.md. Inspect the supporting passage and recheck source coverage after edits; never refresh review digests merely to silence validation. Citations support original explanations/examples, and must not falsely imply copied textbook provenance. Keep source details collapsed and out of answer-choice controls.
- Never commit credentials, secret.txt, signing material, or personal answers. Never print passwords, provider keys, cookies, or session tokens.
- Server data stays under /var/lib/math-foundations; retain weekly backups and rollback deployments.
