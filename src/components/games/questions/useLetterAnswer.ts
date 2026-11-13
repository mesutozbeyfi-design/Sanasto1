import { useCallback, useState } from 'react';
import { useSpokenFeedback } from '@/components/games/questions/questionShared';
import { isAnswerCorrect } from '@/lib/games/answerCheck';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

export type LetterSlotTone = 'idle' | 'solved' | 'revealed';

export function useLetterAnswer(word: Word, hiddenIndexes: number[]) {
  const chars = [...word.finnish.normalize('NFC')];
  const [inputs, setInputs] = useState<string[]>(() => hiddenIndexes.map(() => ''));
  const [hadWrongAttempt, setHadWrongAttempt] = useState(false);
  const [errorSlot, setErrorSlot] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isSpoken = useSpokenFeedback(isSolved, word.finnish, 'fi');

  const isLocked = isSolved || isRevealed;
  const tone: LetterSlotTone = isSolved ? 'solved' : isRevealed ? 'revealed' : 'idle';
  const results: WordResult[] = [toWordResult(word, !hadWrongAttempt)];

  const composeAnswer = (values: string[]) =>
    chars
      .map((char, index) => {
        const slot = hiddenIndexes.indexOf(index);
        return slot === -1 ? char : values[slot] ?? '';
      })
      .join('');

  const pick = useCallback(
    (letter: string) => {
      if (isLocked) return;
      const firstEmpty = inputs.indexOf('');
      if (firstEmpty === -1) return;
      const expected = chars[hiddenIndexes[firstEmpty]];
      if (letter !== expected) {
        setHadWrongAttempt(true);
        setErrorSlot(firstEmpty);
        window.setTimeout(() => setErrorSlot((current) => (current === firstEmpty ? null : current)), 500);
        return;
      }
      setErrorSlot(null);
      const next = inputs.map((value, index) => (index === firstEmpty ? letter : value));
      const answer = composeAnswer(next);
      setInputs(next);
      if (isAnswerCorrect(answer, word.finnish)) {
        setIsSolved(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs, isLocked, chars, hiddenIndexes, word.finnish],
  );

  const changeSlot = useCallback(
    (slot: number, letter: string) => {
      if (isLocked || !letter) return;
      const expected = chars[hiddenIndexes[slot]];
      if (letter !== expected) {
        setHadWrongAttempt(true);
        setErrorSlot(slot);
        window.setTimeout(() => setErrorSlot((current) => (current === slot ? null : current)), 500);
        return;
      }
      setErrorSlot(null);
      const next = inputs.map((value, index) => (index === slot ? letter : value));
      const answer = composeAnswer(next);
      setInputs(next);
      if (isAnswerCorrect(answer, word.finnish)) {
        setIsSolved(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs, isLocked, chars, hiddenIndexes, word.finnish],
  );

  return {
    chars,
    inputs,
    changeSlot,
    pick,
    errorSlot,
    tone,
    isLocked,
    isSolved,
    isRevealed,
    isSpoken,
    hadWrongAttempt,
    results,
    reveal: () => setIsRevealed(true),
  };
}
