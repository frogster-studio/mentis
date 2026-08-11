# Context map

This repo has two bounded contexts. Each keeps its own glossary; use the vocabulary of the context you are working in.

| Context | Lives in | Glossary | In one line |
| --- | --- | --- | --- |
| Card curation | `apps/admin/` | [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) | Editors curate the library of general-knowledge Cards. |
| Quiz play | `apps/mobile/` | [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) | Players play "Cash ou Carré" quizzes in French, optionally with an Account. |

## Shared language

The two contexts are deliberately disjoint: a **Card** (curation) is content performed by a human in video/audio formats, and the quiz app consumes none of it — **Themes** and **Questions** (quiz play) are authored and hosted separately. No table crosses the boundary; the only shared asset is the Supabase project itself (`supabase/` at the repo root holds both contexts' schema). When `apps/api` becomes the sole database gateway, any future integration between the contexts is published through it.
