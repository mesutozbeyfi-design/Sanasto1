interface LetterSlotsProps {
  chars: string[];
  hiddenIndexes: number[];
  values: string[];
  tone: 'idle' | 'solved' | 'revealed';
  errorSlot: number | null;
}

export default function LetterSlots({ chars, hiddenIndexes, values, tone, errorSlot }: LetterSlotsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Kelime">
      {chars.map((char, index) => {
        if (char === ' ') return <span key={index} className="w-3 sm:w-4" />;
        const slot = hiddenIndexes.indexOf(index);
        if (slot === -1) {
          return (
            <span
              key={index}
              className="flex h-12 w-9 items-center justify-center text-2xl font-bold text-slate-900 sm:h-14 sm:w-10"
            >
              {char}
            </span>
          );
        }
        const isError = errorSlot === slot;
        const filled = values[slot] !== '';
        return (
          <span
            key={index}
            className={`flex h-12 w-9 items-center justify-center rounded-lg border-b-2 text-2xl font-bold transition sm:h-14 sm:w-10 ${
              isError
                ? 'animate-shake border-rose-500 bg-rose-50 text-rose-700'
                : filled
                  ? 'border-emerald-500 bg-emerald-50 text-slate-900'
                  : 'border-slate-300 bg-white text-slate-900'
            } ${tone === 'revealed' ? 'border-slate-300 bg-slate-50' : ''}`}
          >
            {values[slot] || ''}
          </span>
        );
      })}
    </div>
  );
}
