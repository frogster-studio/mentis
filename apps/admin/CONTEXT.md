# Catalog curation

The back-office context where Editors author the quiz catalog and stage what players may see. Its vocabulary is invisible to players: from the app's side, an unstaged Question or Theme simply does not exist.

## Language

**Editor**:
A hand-provisioned account allowed to curate the Catalog, recognized by a server-controlled claim.
_Avoid_: admin, admin user, back-office user

**Catalog**:
The player-facing quiz content as a whole — Categories, Themes and Questions.
_Avoid_: immutable data, content, quiz data

**Ready To Be Published**:
The Editor-set flag marking a Question fit to serve. Every stored Question is complete by construction; this flag is the deliberate staging act, off by default.
_Avoid_: published (of a Question), draft, ready (alone)

**Published**:
The Editor-controlled switch that makes a Theme and its Ready Questions servable, off by default. Flipping it on is allowed only while the Theme holds at least 20 Ready Questions — a back-office rule the serving side never knows.
_Avoid_: live, active, visible (of a Theme)

**Visible**:
The derived state of a Category holding at least one Published Theme. Never stored, never toggled.
_Avoid_: published (of a Category)
