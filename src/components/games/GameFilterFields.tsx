import SelectionFilterFields from '@/components/SelectionFilterFields';
import SortDropdown from '@/components/SortDropdown';
import { type GameSetupConfig } from '@/lib/games/gameConfig';
import type { Category, Word } from '@/lib/vocabulary';
import type { WordListSort } from '@/lib/wordSort';

type GameSort = WordListSort | 'random';

const GAME_SORT_OPTIONS: { value: GameSort; label: string }[] = [
  { value: 'added', label: 'Eklenme sırası' },
  { value: 'finnish', label: 'Fince A-Z' },
  { value: 'turkish', label: 'Türkçe A-Z' },
  { value: 'random', label: 'Karışık' },
];

interface GameFilterFieldsProps {
  config: GameSetupConfig;
  onChange: (config: GameSetupConfig) => void;
  categories: Category[];
  words: Word[];
  hideCategoryFilter?: boolean;
}

export default function GameFilterFields({ config, onChange, categories, words, hideCategoryFilter = false }: GameFilterFieldsProps) {
  const update = (patch: Partial<GameSetupConfig>) => onChange({ ...config, ...patch });

  const sortValue: GameSort = config.order === 'alphabetical' ? config.alphabetLanguage : config.order;
  const applySort = (value: GameSort) => {
    if (value === 'finnish' || value === 'turkish') {
      update({ order: 'alphabetical', alphabetLanguage: value });
      return;
    }
    update({ order: value });
  };

  return (
    <div className="space-y-6">
      <SelectionFilterFields
        categoryLabel="Ana kategoriler"
        categories={categories}
        words={words}
        filters={config}
        onChange={update}
        hideCategoryFilter={hideCategoryFilter}
        toggles={[]}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-700">Kelime sıralaması</legend>
        <SortDropdown label="Kelime sıralaması" options={GAME_SORT_OPTIONS} value={sortValue} onChange={applySort} />
      </fieldset>
    </div>
  );
}
