import type { ReactNode } from "react";
import { AnswerFooter } from "@/features/quiz/components/answer-footer";
import { PlayHeader } from "@/features/quiz/components/play-header";
import { PlayScreen } from "@/features/quiz/components/play-screen";
import type { QuestionPlay } from "@/features/quiz/question-play";
import type { PlayLoop } from "@/features/quiz/use-play-loop";

export interface PlayShellProps {
  play: QuestionPlay;
  total: number;
  loop: PlayLoop;
  categoryColor: string;
  showCrown: boolean;
  quitLabel: string;
  headerExtra: ReactNode;
  onInputChange: (value: string) => void;
  onSelect: (index: number) => void;
  onConfirm: (now: number) => void;
}

export const PlayShell = ({
  play,
  total,
  loop,
  categoryColor,
  showCrown,
  quitLabel,
  headerExtra,
  onInputChange,
  onSelect,
  onConfirm,
}: PlayShellProps) => {
  return (
    <PlayScreen
      questionText={loop.transition.question}
      position={loop.transition.position}
      total={total}
      categoryColor={categoryColor}
      collapsed={loop.transition.collapsed}
      questionOpacity={loop.transition.opacity}
      header={
        <>
          <PlayHeader
            showCrown={showCrown}
            endsAt={play.endsAt}
            now={loop.now}
            countdownFrozen={loop.transition.countdownFrozen}
            quitLabel={quitLabel}
            onQuit={loop.requestQuit}
          />
          {headerExtra}
        </>
      }
      footer={
        <AnswerFooter
          play={play}
          categoryColor={categoryColor}
          inputRef={loop.inputRef}
          autoFocus={!loop.quitVisible}
          onInputChange={onInputChange}
          onSwitchToSquare={loop.switchToSquare}
          onSelect={onSelect}
          onConfirm={() => onConfirm(Date.now())}
        />
      }
    />
  );
};
