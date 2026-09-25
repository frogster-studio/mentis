import type { ReactNode } from "react";
import { View } from "react-native";
import { AnswerFooter } from "@/features/quiz/components/answer-footer";
import { PlayHeader } from "@/features/quiz/components/play-header";
import { PlayView } from "@/features/quiz/components/play-view";
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
  footerExtra: ReactNode;
  onQuit: () => void;
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
  footerExtra,
  onQuit,
  onInputChange,
  onSelect,
  onConfirm,
}: PlayShellProps) => {
  return (
    <PlayView
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
            countdownFrozen={loop.transition.countdownFrozen || loop.isHeld}
            quitLabel={quitLabel}
            onQuit={onQuit}
          />
          {headerExtra}
        </>
      }
      footer={
        <>
          {/* A held play keeps its answer controls in view but out of reach. */}
          <View pointerEvents={loop.isHeld ? "none" : "auto"}>
            <AnswerFooter
              play={play}
              categoryColor={categoryColor}
              inputRef={loop.inputRef}
              autoFocus={!loop.quitVisible && !loop.isHeld}
              onInputChange={onInputChange}
              onSwitchToSquare={loop.switchToSquare}
              onSelect={onSelect}
              onConfirm={() => onConfirm(Date.now())}
            />
          </View>
          {footerExtra}
        </>
      }
    />
  );
};
