# Project documentation

Start with the [repository README](../README.md) for installation and common checks.

| Guide                                               | Purpose                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Architecture](architecture.md)                     | Components, data flow, and compatibility boundaries                           |
| [Web client](web-client.md)                         | Local API setup, navigation, answers, offline work, and imports               |
| [Content authoring](content-authoring.md)           | Canonical files, MDX components, teaching requirements, and stable identities |
| [Content sources](content-sources.md)               | Citation policy and source-inspection workflow                                |
| [Grading](grading.md)                               | Submissions, grading jobs, transcription, retries, and catalog recovery       |
| [Deterministic contract](deterministic-contract.md) | Structured answer schemas, validators, and authoring constraints              |
| [Review system](review-system.md)                   | Scheduling, sessions, practice, and review authoring                          |
| [Learning evidence](learning-evidence.md)           | Concept/skill mappings, attempt evidence, and progress interpretation         |
| [Tooling and tests](tooling.md)                     | Validation commands, CI, browser checks, and independent verification         |
| [Deployment](pwa-deployment.md)                     | Production releases, authentication, configuration, and rollback              |
| [Backup and recovery](backup-media-integrity.md)    | Database/media snapshots, retention, verification, and restore                |

Keep `docs/` focused on operating, developing, and understanding the current
project. Update the relevant guide when behavior changes. Development journals,
completed plans, release acceptance screenshots, and one-time audit reports belong
in Git history. Generated reports and browser captures go under ignored `output/`;
required verification data belongs beside its consuming tools or tests. Curriculum
and source-inspection records remain in `content/`.
