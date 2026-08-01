# Context map

This repo has two bounded contexts. Each keeps its own glossary; use the vocabulary of the context you are working in.

| Context | Lives in | Glossary | In one line |
| --- | --- | --- | --- |
| Card curation | `apps/admin/` | [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) | Editors curate the library of general-knowledge Cards. |
| Quiz play | `apps/mobile/` | [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) | Players play "Cash ou Carré" quizzes in French, optionally with an Account. |

## Shared language

**Card** originates in the curation context (one unit of general-knowledge content, of exactly one Card Type) and is consumed downstream by the quiz context. The integration point is the shared Supabase schema (`supabase/` at the repo root): curation writes it, play reads it. When the planned `apps/api` context appears as the sole database gateway, it becomes the owner of that published language.
