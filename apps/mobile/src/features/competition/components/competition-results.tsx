import type { AppCompetitionTranscriptResponse } from "@mentis/contracts/app";
import { Button } from "@/components/ui/button";
import { COMPETITION_RESULTS_HOME_LABEL } from "@/features/competition/constants";
import { ResultCard } from "@/features/quiz/components/result-card";
import { ResultsScreen } from "@/features/quiz/components/results-screen";

export interface CompetitionResultsProps {
  transcript: AppCompetitionTranscriptResponse;
  onGoHome: () => void;
}

export const CompetitionResults = ({ transcript, onGoHome }: CompetitionResultsProps) => {
  return (
    <ResultsScreen
      score={transcript.score}
      themeName={transcript.themeName}
      footer={<Button label={COMPETITION_RESULTS_HOME_LABEL} onPress={onGoHome} pending={false} />}
    >
      {transcript.answers.map((answer) => (
        <ResultCard
          key={answer.position}
          questionText={answer.questionText}
          canonicalAnswer={answer.canonicalAnswer}
          answerText={answer.rawInput ?? ""}
          mode={answer.mode}
          correct={answer.correct}
          points={answer.points}
        />
      ))}
    </ResultsScreen>
  );
};
