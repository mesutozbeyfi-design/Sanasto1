import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import FlipCardGrid from '@/components/games/questions/FlipCardGrid';
import { useChoiceRound, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import type { Word } from '@/lib/vocabulary';

interface FlipImageQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function FlipImageQuestion({ word, options, onDone, isSaving }: FlipImageQuestionProps) {
  useAutoSpeak(word.finnish, 'fi');
  const round = useChoiceRound(word);
  const isSpoken = useSpokenFeedback(round.isSolved, word.finnish, 'fi');

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-2xl font-bold text-slate-900">{word.finnish}</p>
      </div>

      <FlipCardGrid options={options} target={word} faceText={(option) => option.turkish} round={round} square />

      {(round.isSolved || round.hadWrongAttempt) && (
        <GameFeedback
          correct={round.isSolved}
          title={round.isSolved ? 'Doğru!' : 'Yanlış kart, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru cevap: <strong>{word.turkish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={round.isRevealed}
          isReady={isSpoken}
          isSaving={isSaving}
          onReveal={round.reveal}
          onContinue={() => onDone(round.results)}
        />
      )}
    </section>
  );
}
