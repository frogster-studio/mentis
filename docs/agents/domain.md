# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`apps/mobile/CONTEXT.md`** — the glossary of the repo's single bounded context, Quiz play.
- **ADRs** that touch the area you're about to work in: context-scoped decisions live in `apps/<app>/docs/adr/`; system-wide decisions live in `docs/adr/` at the root.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This is a **single-context** repo — Quiz play, whose glossary lives with the app that owns it:

```
/
├── docs/adr/                          ← system-wide decisions
└── apps/mobile/                       ← Quiz play context
    ├── CONTEXT.md
    └── docs/adr/
```

A second context gets its own `apps/<app>/CONTEXT.md` plus a root `CONTEXT-MAP.md` mapping them.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0002 (supabase-only backend) — but worth reopening because…_
