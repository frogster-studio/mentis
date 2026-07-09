import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  QuizPayload,
  RiddlePayload,
  TrueFalsePayload,
} from "@/lib/cards/schema";

// Type-specific form fields shared by the create and edit sheets. Without a
// payload the fields render empty for a new Card. Field names line up with
// payloadFromFormData in lib/cards/actions.ts.

export function CardTypeFields({
  card,
}: {
  card:
    | { type: "anecdote" | "did-you-know"; payload?: { body: string } }
    | { type: "quiz"; payload?: QuizPayload }
    | { type: "true-false"; payload?: TrueFalsePayload }
    | { type: "riddle"; payload?: RiddlePayload };
}) {
  switch (card.type) {
    case "quiz":
      return <QuizFields payload={card.payload} />;
    case "true-false":
      return <TrueFalseFields payload={card.payload} />;
    case "riddle":
      return <RiddleFields payload={card.payload} />;
    default:
      // Anecdote and Did You Know share the body-only form; only the stored
      // type value differs.
      return <AnecdoteFields payload={card.payload} />;
  }
}

function AnecdoteFields({ payload }: { payload?: { body: string } }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="body">Body</Label>
      <Textarea id="body" name="body" rows={12} defaultValue={payload?.body} />
    </div>
  );
}

function QuizFields({ payload }: { payload?: QuizPayload }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="question">Question</Label>
        <Textarea
          id="question"
          name="question"
          rows={3}
          defaultValue={payload?.question}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-medium text-sm leading-none">
          Choices
        </legend>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="radio"
              name="correctChoice"
              value={index}
              defaultChecked={payload?.choices[index]?.correct}
              aria-label={`Choice ${index + 1} is the correct answer`}
              className="size-4 shrink-0 accent-primary"
            />
            <Input
              name={`choice-${index}`}
              defaultValue={payload?.choices[index]?.text}
              aria-label={`Choice ${index + 1}`}
            />
          </div>
        ))}
        <p className="text-muted-foreground text-sm">
          Select the correct Choice with the round button.
        </p>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          rows={4}
          defaultValue={payload?.explanation}
        />
      </div>
    </>
  );
}

function TrueFalseFields({ payload }: { payload?: TrueFalsePayload }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="assertion">Assertion</Label>
        <Textarea
          id="assertion"
          name="assertion"
          rows={3}
          defaultValue={payload?.assertion}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-medium text-sm leading-none">
          Answer
        </legend>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="answer-true"
              name="answer"
              value="true"
              defaultChecked={payload?.answer === true}
              className="size-4 shrink-0 accent-primary"
            />
            <Label htmlFor="answer-true">True</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="answer-false"
              name="answer"
              value="false"
              defaultChecked={payload?.answer === false}
              className="size-4 shrink-0 accent-primary"
            />
            <Label htmlFor="answer-false">False</Label>
          </div>
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          rows={4}
          defaultValue={payload?.explanation}
        />
      </div>
    </>
  );
}

function RiddleFields({ payload }: { payload?: RiddlePayload }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="clues">Clues</Label>
        <Textarea
          id="clues"
          name="clues"
          rows={6}
          defaultValue={payload?.clues}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="answer">Answer</Label>
        <Input id="answer" name="answer" defaultValue={payload?.answer} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bonusInfo">Bonus Info (optional)</Label>
        <Textarea
          id="bonusInfo"
          name="bonusInfo"
          rows={4}
          defaultValue={payload?.bonusInfo}
        />
      </div>
    </>
  );
}
