import type { GameDefinition } from '@/lib/games/gameDefinitions';
import { orderWords, type AlphabetLanguage, type WordOrder } from '@/lib/wordSort';
import type { Word } from '@/lib/vocabulary';
import { ALL_LEARNING_STATUSES, matchesSelectionFilters, type WordSelectionFilters } from '@/lib/wordFilters';
import type { LearningStatus } from '@/lib/vocabulary';

export interface GameSetupConfig extends WordSelectionFilters {
  order: WordOrder;
  alphabetLanguage: AlphabetLanguage;
}

export const DEFAULT_GAME_CONFIG: GameSetupConfig = {
  categoryIds: [],
  favoritesOnly: false,
  learningStatuses: ALL_LEARNING_STATUSES,
  order: 'added',
  alphabetLanguage: 'finnish',
};

function isLearningStatus(value: unknown): value is LearningStatus {
  return ALL_LEARNING_STATUSES.some((status) => status === value);
}

function parseLearningStatuses(stored: Partial<GameSetupConfig>): LearningStatus[] {
  if (Array.isArray(stored.learningStatuses)) return stored.learningStatuses.filter(isLearningStatus);
  return DEFAULT_GAME_CONFIG.learningStatuses;
}

export function parseGameSettings(raw: unknown): GameSetupConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_GAME_CONFIG;
  const stored = raw as Partial<GameSetupConfig>;
  return {
    ...DEFAULT_GAME_CONFIG,
    ...stored,
    categoryIds: Array.isArray(stored.categoryIds) ? stored.categoryIds : [],
    learningStatuses: parseLearningStatuses(stored),
  };
}

export function hasImage(word: Word): boolean {
  return Boolean(word.image_url);
}

function matchesFilters(word: Word, config: GameSetupConfig): boolean {
  if (!matchesSelectionFilters(word, config)) return false;
  return true;
}

export function getCandidateWords(words: Word[], config: GameSetupConfig, requiresImage: boolean): Word[] {
  return words.filter((word) => matchesFilters(word, config) && (!requiresImage || hasImage(word)));
}

export function selectGameWords(words: Word[], config: GameSetupConfig, requiresImage: boolean): Word[] {
  const pool = getCandidateWords(words, config, requiresImage);
  return orderWords(pool, config.order, config.alphabetLanguage);
}

export function countWordsWithoutImage(words: Word[], config: GameSetupConfig): number {
  return words.filter((word) => matchesFilters(word, config) && !hasImage(word)).length;
}

export function getSetupIssues(
  definition: GameDefinition,
  pool: Word[],
  library: Word[],
  config: GameSetupConfig,
): string[] {
  if (config.learningStatuses.length === 0) {
    return ['Henüz öğrenme durumu seçmediniz. En az bir durum işaretleyin.'];
  }
  const issues: string[] = [];
  if (pool.length === 0) {
    issues.push('Seçilen filtrelere uyan kelime yok. Filtreleri değiştirin.');
  }
  if (definition.optionCount) {
    const candidates = definition.optionsNeedImage ? library.filter(hasImage) : library;
    if (candidates.length < definition.optionCount) {
      const imageNote = definition.optionsNeedImage ? 'görselli ' : '';
      issues.push(
        `Bu oyun için en az ${definition.optionCount} ${imageNote}kelime gerekir. Şu an ${candidates.length} tane var.`,
      );
    }
  }
  return issues;
}
