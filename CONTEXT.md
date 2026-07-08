# Mentis

A back-office for curating a library of general-knowledge Cards. Cards are written and managed by editors today, performed by a human (video/audio content), and may be consumed programmatically by an app later.

## Language

**Card**:
One unit of general-knowledge content, of exactly one Card Type.
_Avoid_: GK content, content, item, entry

**Card Type**:
The structural kind of a Card. One of: Quiz, True/False, Anecdote, Did You Know, Riddle.
_Avoid_: category (that's what Tags are for)

**Quiz**:
A Card asking a question with exactly four free-text Choices, of which exactly one is correct, followed by an Explanation.

**True/False**:
A Card stating an Assertion whose answer is either true or false, followed by an Explanation.
_Avoid_: Right or false

**Anecdote**:
A Card telling a story-like fact. No interaction is asked of the audience. Same shape as Did You Know, editorially distinct.

**Did You Know**:
A Card explaining a concept or term. No interaction is asked of the audience. Same shape as Anecdote, editorially distinct.

**Riddle**:
A Card giving clues about something to guess, followed by the Answer and optional Bonus Info.

**Choice**:
One of the four possible answers of a Quiz. Free text; may contain humor or commentary.
_Avoid_: option, answer (reserved for True/False and Riddle answers)

**Explanation**:
The text revealed after a Quiz or True/False answer, giving the background of the correct answer.

**Bonus Info**:
Optional extra context at the end of a Riddle (the "et pour info…" part).

**Title**:
A short editor-facing label on every Card, used to find it in the back-office. Never shown to the final audience.

**Tag**:
A free-form theme label (e.g. "histoire", "droit"). A Card has zero or more Tags.
_Avoid_: theme, category

**Image**:
An audience-facing illustration attached to a Card. A Card has zero to three Images, in a meaningful display order.
_Avoid_: attachment, photo

**Caption**:
Optional short audience-facing text accompanying an Image.

**Draft**:
Card status: work in progress, not ready for consumption.

**Published**:
Card status: validated and ready to be performed or consumed.
