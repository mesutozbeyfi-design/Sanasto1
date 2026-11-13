import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Modal from '@/components/Modal';
import { useLibrary } from '@/contexts/LibraryContext';

interface AutoImageModalProps {
  onClose: () => void;
  words?: import('@/lib/vocabulary').Word[];
}

const PREVIEW_LIMIT = 12;

export default function AutoImageModal({ onClose, words: scopedWords }: AutoImageModalProps) {
  const { words: libraryWords, generateAiImages } = useLibrary();
  const words = scopedWords ?? libraryWords;
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ saved: number; errorMessage: string | null } | null>(null);
  const targets = useMemo(() => words.filter((word) => !word.image_url), [words]);

  const handleGenerate = async () => {
    if (targets.length === 0) return;
    setPhase('running');
    setProgress(0);
    const outcome = await generateAiImages(targets, setProgress);
    setResult(outcome);
    setPhase('done');
  };

  return (
    <Modal title="Toplu otomatik görsel ata" onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-slate-600">
          Görseli olmayan kelimeler için anlamı analiz edilerek gerçekçi, kelimeyi açıkça anlatan görseller oluşturulur. Mevcut görseller korunur.
        </p>

        {phase === 'idle' && (
          <>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-slate-900">{targets.length} kelime görselsiz</p>
              <p className="mt-1 text-sm text-slate-600">Üretim her kelime için ayrı yapılır ve birkaç dakika sürebilir.</p>
            </div>
            {targets.length > 0 ? (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {targets.slice(0, PREVIEW_LIMIT).map((word) => (
                  <li key={word.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block truncate text-sm font-semibold text-slate-900">{word.finnish}</span>
                    <span className="block truncate text-xs text-slate-500">{word.turkish}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Tüm kelimelerinizde zaten görsel var.</p>
            )}
          </>
        )}

        {phase === 'running' && (
          <div className="space-y-3" role="status">
            <div className="flex items-center justify-center gap-2 font-semibold text-slate-800"><Sparkles className="h-5 w-5 text-blue-600" /> {progress} / {targets.length} görsel oluşturuluyor <Loader2 className="h-4 w-4 animate-spin text-slate-500" /></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${targets.length ? Math.round((progress / targets.length) * 100) : 0}%` }} /></div>
          </div>
        )}

        {phase === 'done' && result && (
          <div role="status" className="space-y-2">
            <p className={result.errorMessage ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'}>{result.saved} kelimeye görsel kaydedildi.</p>
            {result.errorMessage && <p className="text-sm text-slate-600">{result.errorMessage}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">{phase === 'done' ? 'Kapat' : 'Vazgeç'}</button>
          {phase === 'idle' && <button type="button" onClick={() => void handleGenerate()} disabled={targets.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Otomatik görsel ata</button>}
        </div>
      </div>
    </Modal>
  );
}
