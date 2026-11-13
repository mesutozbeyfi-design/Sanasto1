import { useState } from 'react';
import GoogleAiModePanel from '@/components/GoogleAiModePanel';
import ImageField, { type ImageDraft } from '@/components/ImageField';
import Modal from '@/components/Modal';
import { PICKER_SOURCES, type PickerSourceId } from '@/lib/imageSources';
import type { ImageSource } from '@/lib/vocabulary';

export interface PickedImage {
  file: File | null;
  url: string | null;
  source: ImageSource | null;
  credit: string | null;
}

interface ImagePickerProps {
  finnish: string;
  turkish: string;
  onPick: (picked: PickedImage) => void;
  onClose: () => void;
}

const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-word-image`;

export default function ImagePicker({ finnish, turkish, onPick, onClose }: ImagePickerProps) {
  const [sourceId, setSourceId] = useState<PickerSourceId>('auto_ai');
  const [draft, setDraft] = useState<ImageDraft>({ file: null, url: null, source: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutomaticImage = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ finnish, turkish }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      onPick({ file: null, url: data.url, source: 'ai_generated', credit: 'Cloudflare Workers AI · Llama prompt + Stable Diffusion XL' });
    } catch {
      setError('Otomatik görsel oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmUpload = () => {
    if (!draft.file && !draft.url) return;
    onPick({ file: draft.file, url: draft.url, source: draft.source, credit: null });
  };

  return (
    <Modal title="Görsel seç" onClose={onClose}>
      <div className="space-y-5">
        <div role="tablist" aria-label="Görsel kaynağı" className="flex flex-wrap gap-2">
          {PICKER_SOURCES.map((source) => {
            const active = source.id === sourceId;
            return (
              <button
                key={source.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSourceId(source.id);
                  setError(null);
                  setDraft({ file: null, url: null, source: null });
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        {sourceId === 'auto_ai' && (
          <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div>
              <h3 className="font-semibold text-slate-900">Kelimeye uygun görsel oluştur</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">Yapay zeka önce kelimenin anlamını analiz eder, ardından gerçekçi bir görsel üretir.</p>
            </div>
            <button
              type="button"
              onClick={() => void handleAutomaticImage()}
              disabled={isGenerating}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isGenerating ? 'Görsel oluşturuluyor...' : 'Otomatik görsel ata'}
            </button>
          </div>
        )}

        {sourceId === 'google_ai_mode' && (
          <GoogleAiModePanel finnish={finnish} turkish={turkish} draft={draft} onChange={setDraft} />
        )}
        {sourceId === 'upload' && (
          <div className="space-y-4">
            <ImageField value={draft} onChange={setDraft} />
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={!draft.file && !draft.url}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              Bu görseli kullan
            </button>
          </div>
        )}

        {sourceId === 'google_ai_mode' && draft.file && (
          <button type="button" onClick={handleConfirmUpload} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800">Bu görseli kullan</button>
        )}
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {sourceId === 'google_ai_mode' && <p className="text-xs text-slate-500">Google AI Mode yeni sekmede açılır; görseli indirip buraya yükleyebilirsiniz.</p>}
      </div>
    </Modal>
  );
}
