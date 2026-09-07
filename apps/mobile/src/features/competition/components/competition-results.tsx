import type { AppCompetitionTranscriptResponse } from "@mentis/contracts/app";
import { Button } from "@/components/ui/button";
import { NewButton } from "@/components/ui/new-button";
import {
  type OtherAttempt,
  OtherAttemptLink,
} from "@/features/competition/components/other-attempt-link";
import {
  COMPETITION_REPLAY_LABEL,
  COMPETITION_RESULTS_HOME_LABEL,
} from "@/features/competition/constants";
import { ResultCard } from "@/features/quiz/components/result-card";
import { ResultsHomeLink } from "@/features/quiz/components/results-home-link";
import { ResultsScreen } from "@/features/quiz/components/results-screen";

export interface CompetitionResultsProps {
  transcript: AppCompetitionTranscriptResponse;
  // Null whenever the day offers no Replay: after a Replay or a Catch-up, or once it is spent.
  onReplay: (() => void) | null;
  // Null unless today holds a second judged Attempt: only the best of the two counts for the day.
  otherAttempt: OtherAttempt | null;
  onGoHome: () => void;
}

export const CompetitionResults = ({
  transcript,
  onReplay,
  otherAttempt,
  onGoHome,
}: CompetitionResultsProps) => {
  return (
    <ResultsScreen
      score={transcript.score}
      themeName={transcript.themeName}
      outcomes={transcript.answers.map((answer) => answer.correct)}
      footer={
        <>
          {onReplay ? (
            <NewButton
              layout="block"
              shape="full"
              tone="primary"
              icon="replay"
              label={COMPETITION_REPLAY_LABEL}
              accessibilityLabel={null}
              onPress={onReplay}
              disabled={false}
              pending={false}
            />
          ) : null}
          {otherAttempt ? <OtherAttemptLink attempt={otherAttempt} /> : null}
          {onReplay ? (
            <ResultsHomeLink label={COMPETITION_RESULTS_HOME_LABEL} onPress={onGoHome} />
          ) : (
            <Button label={COMPETITION_RESULTS_HOME_LABEL} onPress={onGoHome} pending={false} />
          )}
        </>
      }
    >
      {transcript.answers.map((answer) => (
        <ResultCard
          key={answer.position}
          position={answer.position + 1}
          total={transcript.answers.length}
          questionText={answer.questionText}
          canonicalAnswer={answer.canonicalAnswer}
          answerText={answer.rawInput ?? ""}
          correct={answer.correct}
          points={answer.points}
        />
      ))}
    </ResultsScreen>
  );
};
