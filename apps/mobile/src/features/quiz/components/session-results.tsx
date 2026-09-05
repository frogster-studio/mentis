import { NewButton } from "@/components/ui/new-button";
import { ResultCard } from "@/features/quiz/components/result-card";
import { ResultsHomeLink } from "@/features/quiz/components/results-home-link";
import { ResultsScreen } from "@/features/quiz/components/results-screen";
import { RESULTS_HOME_LABEL, RESULTS_REPLAY_LABEL } from "@/features/quiz/constants";
import { type SessionAnswer, sessionScore } from "@/features/quiz/session-reducer";
import type { Question } from "@/types/quiz";

export interface SessionResultsProps {
  themeName: string;
  questions: Question[];
  answers: SessionAnswer[];
  onReplay: () => void;
  onGoHome: () => void;
}

export const SessionResults = ({
  themeName,
  questions,
  answers,
  onReplay,
  onGoHome,
}: SessionResultsProps) => {
  return (
    <ResultsScreen
      score={sessionScore(answers)}
      themeName={themeName}
      outcomes={answers.map((answer) => answer.correct)}
      footer={
        <>
          <NewButton
            layout="block"
            shape="full"
            tone="primary"
            icon="play-circle-outline"
            label={RESULTS_REPLAY_LABEL}
            accessibilityLabel={null}
            onPress={onReplay}
            disabled={false}
            pending={false}
          />
          <ResultsHomeLink label={RESULTS_HOME_LABEL} onPress={onGoHome} />
        </>
      }
    >
      {questions.map((question, index) => (
        <ResultCard
          key={question.id}
          position={index + 1}
          total={questions.length}
          questionText={question.text}
          canonicalAnswer={question.answer}
          answerText={answers[index].input}
          correct={answers[index].correct}
          points={answers[index].points}
        />
      ))}
    </ResultsScreen>
  );
};
