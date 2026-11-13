interface LetterPickerProps {
  tiles: string[];
  values: string[];
  disabled: boolean;
  onPick: (letter: string) => void;
}

export default function LetterPicker({ tiles, values, disabled, onPick }: LetterPickerProps) {
  const remaining = new Map<string, number>();
  for (const value of values) {
    if (value) remaining.set(value, (remaining.get(value) ?? 0) + 1);
  }

  const usedTiles = tiles.map((letter) => {
    const count = remaining.get(letter) ?? 0;
    if (count === 0) return false;
    remaining.set(letter, count - 1);
    return true;
  });

  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
      {tiles.map((letter, index) => {
        const isUsed = usedTiles[index];
        return (
          <button
            key={`${letter}-${index}`}
            type="button"
            onClick={() => onPick(letter)}
            disabled={disabled || isUsed}
            aria-label={`${letter} harfini seç`}
            className={`h-10 min-w-9 px-1 rounded-lg text-2xl font-bold transition sm:h-11 sm:min-w-10 ${
              isUsed
                ? 'text-slate-300'
                : 'text-slate-900 hover:text-blue-700 active:scale-95 disabled:opacity-50'
            }`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
