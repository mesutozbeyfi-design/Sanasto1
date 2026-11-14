import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileUp, Plus, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import AutoImageModal from '@/components/AutoImageModal';
import BulkExportModal from '@/components/BulkExportModal';
import MissingImageNotice from '@/components/MissingImageNotice';
import PageHeader from '@/components/PageHeader';
import WordFilterBar from '@/components/WordFilterBar';
import WordFormModal from '@/components/WordFormModal';
import WordImportModal from '@/components/WordImportModal';
import WordList from '@/components/WordList';
import { useLibrary } from '@/contexts/LibraryContext';
import SortDropdown from '@/components/SortDropdown';
import { useStoredState } from '@/hooks/useStoredState';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { EMPTY_WORD_FILTERS, filterWords, type WordFilters } from '@/lib/wordFilters';
import { sortWordsByListMode, WORD_LIST_SORT_OPTIONS, type WordListSort } from '@/lib/wordSort';

const WORD_SORT_KEY = 'sanasto.wordListSort';

export default function WordsPage() {
  const { words, categories } = useLibrary();
  const [filters, setFilters] = useState<WordFilters>(EMPTY_WORD_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoImaging, setIsAutoImaging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(filterContainerRef, showFilters, () => setShowFilters(false));
  const [sortSettings, setSortSettings] = useStoredState<{ mode: WordListSort }>(WORD_SORT_KEY, { mode: 'added' });
  const sortMode = sortSettings.mode;

  const visibleWords = useMemo(() => {
    return sortWordsByListMode(filterWords(words, filters), sortMode);
  }, [words, filters, sortMode]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_WORD_FILTERS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tüm Kelimeler"
        description={`${words.length} kelime kayıtlı.`}
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setIsExporting(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              <Download className="h-4 w-4 shrink-0" /> <span className="truncate">Toplu dışa aktar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAutoImaging(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              <Sparkles className="h-4 w-4 shrink-0" /> <span className="truncate">Toplu otomatik görsel ata</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              <Plus className="h-4 w-4 shrink-0" /> <span className="truncate">Yeni kelime</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImporting(true)}
              className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
            >
              <FileUp className="h-4 w-4 shrink-0" /> <span className="truncate">Toplu kelime ekle</span>
            </button>
          </div>
        }
      />

      <MissingImageNotice
        count={words.filter((word) => !word.image_url).length}
        onShow={() => setFilters({ ...EMPTY_WORD_FILTERS, noImage: true })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div ref={filterContainerRef} className="relative w-full">
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[28rem]">
            <div className="relative min-w-0">
              <div className={`flex min-w-0 items-center rounded-xl border text-sm font-semibold transition ${
                hasFilters
                  ? 'border-teal-400 bg-teal-100 text-teal-900'
                  : 'border-teal-200 bg-teal-50 text-teal-800'
              }`}>
                <button
                  type="button"
                  aria-label="Filtreler"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((open) => !open)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5 text-left outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{hasFilters ? 'Filtreler (aktif)' : 'Filtreler'}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_WORD_FILTERS)}
                    className="shrink-0 px-2 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <X className="h-3.5 w-3.5" aria-label="Filtreleri temizle" />
                  </button>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <SortDropdown
                label="Kelime sıralaması"
                options={WORD_LIST_SORT_OPTIONS}
                value={sortMode}
                buttonClassName="flex min-w-0 w-full items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-left text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100"
                onChange={(mode) => setSortSettings({ mode })}
              />
            </div>
          </div>
          {showFilters && (
            <div className="absolute inset-x-0 top-full z-20 mt-2">
              <WordFilterBar filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>
      </div>

      <WordList
        words={visibleWords}
        emptyTitle={hasFilters ? 'Bu filtrelere uyan kelime yok' : 'Henüz kelime eklemediniz'}
        emptyText={
          hasFilters
            ? 'Filtreleri temizleyerek bütün kelimelerinizi tekrar görebilirsiniz.'
            : 'Sağ üstteki "Yeni kelime" butonuyla ilk kelimenizi ekleyerek başlayın.'
        }
      />

      {isCreating && <WordFormModal word={null} onClose={() => setIsCreating(false)} />}
      {isExporting && (
        <BulkExportModal
          words={words}
          visibleWords={visibleWords}
          categories={categories}
          onClose={() => setIsExporting(false)}
        />
      )}
      {isImporting && <WordImportModal onClose={() => setIsImporting(false)} />}
      {isAutoImaging && <AutoImageModal onClose={() => setIsAutoImaging(false)} words={visibleWords} />}
    </div>
  );
}
