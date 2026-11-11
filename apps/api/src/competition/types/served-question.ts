export type ServedQuestion = {
  id: string;
  text: string;
  answer: string;
  wrongChoices: string[];
  explanation: string | null;
};
