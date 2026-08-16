import type { QuizPayload, RiddlePayload, TrueFalsePayload } from "@mentis/contracts/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
      // Anecdote and Did You Know share the body-only form; only the stored type differs.
      return <TextareaField id="body" label="Body" rows={12} defaultValue={card.payload?.body} />;
  }
}

// The field's name doubles as its id, which payloadFromFormData reads back.
function TextareaField({
  id,
  label,
  rows,
  defaultValue,
}: {
  id: string;
  label: string;
  rows: number;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={id} rows={rows} defaultValue={defaultValue} />
    </div>
  );
}

function QuizFields({ payload }: { payload?: QuizPayload }) {
  return (
    <>
      <TextareaField id="question" label="Question" rows={3} defaultValue={payload?.question} />
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-medium text-sm leading-none">Choices</legend>
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
      <TextareaField
        id="explanation"
        label="Explanation"
        rows={4}
        defaultValue={payload?.explanation}
      />
    </>
  );
}

function TrueFalseFields({ payload }: { payload?: TrueFalsePayload }) {
  return (
    <>
      <TextareaField id="assertion" label="Assertion" rows={3} defaultValue={payload?.assertion} />
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-medium text-sm leading-none">Answer</legend>
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
      <TextareaField
        id="explanation"
        label="Explanation"
        rows={4}
        defaultValue={payload?.explanation}
      />
    </>
  );
}

function RiddleFields({ payload }: { payload?: RiddlePayload }) {
  return (
    <>
      <TextareaField id="clues" label="Clues" rows={6} defaultValue={payload?.clues} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="answer">Answer</Label>
        <Input id="answer" name="answer" defaultValue={payload?.answer} />
      </div>
      <TextareaField
        id="bonusInfo"
        label="Bonus Info (optional)"
        rows={4}
        defaultValue={payload?.bonusInfo}
      />
    </>
  );
}
