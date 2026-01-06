# Project Discipline (todos.md + CHANGELOG.md)

## todos.md rules
- todos.md is the master plan.
- Every task has a checkbox.
- After any completed step, mark it done and add the next concrete step.
- Keep "Next 1–3 actions" always present.

## CHANGELOG.md rules
- If a change affects users (behavior, CLI/API output, config, migration, bugfix), update CHANGELOG.md under [Unreleased].
- Entries must be short, user-facing, and grouped (Added/Changed/Fixed/Deprecated/Removed/Security).
- Do not remove history; only add or move Unreleased into a version on release.

## Output rule
- End every orchestrator response with:
  - "Next TODOs:" (bulleted)
  - "Changelog impact:" (Yes/No + what section)