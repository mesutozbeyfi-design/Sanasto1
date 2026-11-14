import { useState, type ReactNode } from 'react';
import { BookOpen, Gamepad2, LibraryBig, LogIn, LogOut, GraduationCap, Settings, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSpeechSupported } from '@/lib/speech';
import { useAutoPickVoices, useVoices } from '@/hooks/useSpeechSettings';
import { describeError } from '@/lib/errors';

export type TabId = 'learn' | 'games' | 'words' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const TABS: Tab[] = [
  { id: 'learn', label: 'Öğren', icon: GraduationCap },
  { id: 'games', label: 'Karışık Oyna', icon: Gamepad2 },
  { id: 'words', label: 'Tüm Kelimeler', icon: LibraryBig },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  useAutoPickVoices();
  const finnishVoices = useVoices('fi');
  const showVoiceWarning = isSpeechSupported() && finnishVoices.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {showVoiceWarning && (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-3 text-sm text-amber-900 sm:px-6">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Bu cihazda Fince ses kurulmamuş. Tarayıcınızın veya işletim sisteminizin dil ayarlarından Fince (suomi) ses paketini ekleyebilirsiniz. Fince kelimeler yine de okunabilir ama telaffuz kalitesi düşük olabilir.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        aria-label="Ana menü"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[calc(env(safe-area-inset-bottom)+2px)] pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-blue-100' : ''}`}>
                  <tab.icon className="h-4.5 w-4.5" />
                </span>
                <span className="leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      setSignOutError(describeError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-slate-600">Hesap ve oturum işlemleri.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-slate-900">Sanasto</span>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Oturum açmış hesap</p>
          <p className="truncate text-sm font-semibold text-slate-900">{user?.email ?? 'Bilinmiyor'}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Çıkış yap
        </button>
        {signOutError && (
          <p role="alert" className="text-sm text-rose-700">{signOutError}</p>
        )}
      </section>

      <p className="flex items-center gap-2 px-1 text-sm text-slate-400">
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Oturum açma/kapama işlemleri artık bu ekrandan yapılır.
      </p>
    </div>
  );
}
