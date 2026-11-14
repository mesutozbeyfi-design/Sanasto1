import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Circle, RotateCw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { LEARNING_STATUS_OPTIONS, type LearningStatus } from '@/lib/vocabulary';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';

const STATUS_ICON: Record<LearningStatus, { Icon: typeof Circle; className: string }> = {
  not_studied: { Icon: Circle, className: 'bg-slate-100 text-slate-600' },
  learning: { Icon: BookOpen, className: 'bg-blue-50 text-blue-700' },
  learned: { Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700' },
  review: { Icon: RotateCw, className: 'bg-amber-50 text-amber-700' },
};

interface FlashcardStatusPickerProps {
  status: LearningStatus;
  disabled: boolean;
  onSelect: (status: LearningStatus) => void;
}

export default function FlashcardStatusPicker({ status, disabled, onSelect }: FlashcardStatusPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = LEARNING_STATUS_OPTIONS.find((option) => option.value === status);
  const { Icon, className } = STATUS_ICON[status];

  useDismissOnOutside(menuRef, isOpen, () => setIsOpen(false));

  const toggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchorPosition({
        top: rect.bottom + window.scrollY + 8,
        left: Math.max(8, Math.min(rect.left + window.scrollX - 88, window.scrollX + window.innerWidth - 240)),
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const handleSelect = (next: LearningStatus) => {
    setIsOpen(false);
    onSelect(next);
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-label={`Öğrenme durumu: ${current?.label ?? ''}. Değiştirmek için dokunun`}
        title={current?.label}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:scale-105 active:scale-95 disabled:opacity-60 ${className}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen && anchorPosition && createPortal(
        <div
          ref={menuRef}
          role="group"
          aria-label="Öğrenme durumunu seçin"
          style={{ top: anchorPosition.top, left: anchorPosition.left }}
          className="animate-modal-in fixed z-50 grid w-56 grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {LEARNING_STATUS_OPTIONS.map((option) => {
            const isActive = option.value === status;
            const OptionIcon = STATUS_ICON[option.value].Icon;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelect(option.value)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <OptionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
