import { readyLabel } from "../staging-labels";
import type { Question, Theme } from "../types";
import { Badge } from "./badge";
import { Chips } from "./chips";
import { Field } from "./field";

interface QuestionDetailProps {
  question: Question;
  theme?: Theme;
}

export const QuestionDetail = ({ question, theme }: QuestionDetailProps) => {
  return (
    <>
      <Field label="Question">{question.text}</Field>
      <Field label="Theme">{theme?.name ?? "—"}</Field>
      <Field label="Correct answer">{question.answer}</Field>
      <Field label="Wrong choices">
        <Chips values={question.wrongChoices} />
      </Field>
      <Field label="Aliases">
        <Chips values={question.aliases} />
      </Field>
      <Field label="Misspellings">
        <Chips values={question.misspellings} />
      </Field>
      <Field label="Staging">
        <Badge isOn={question.readyToBePublished}>{readyLabel(question.readyToBePublished)}</Badge>
      </Field>
    </>
  );
};
