import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuizPayload } from "@/lib/cards/schema";

// Type-specific form fields shared by the create and edit sheets. Without a
// payload the fields render empty for a new Card. Field names line up with
// payloadFromFormData in lib/cards/actions.ts.

export function AnecdoteFields({ payload }: { payload?: { body: string } }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="body">Body</Label>
      <Textarea id="body" name="body" rows={12} defaultValue={payload?.body} />
    </div>
  );
}

export function QuizFields({ payload }: { payload?: QuizPayload }) {
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
