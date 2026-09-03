import React, { useState } from 'react';
import { X, Plus, Check, LogOut } from 'lucide-react';
import { getAccountsRegistry, type AccountsRegistry } from '../utils/auth';
import { soundFx } from '../utils/audio';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string;
  onSelectAccount: (email: string, name?: string) => void;
  onGoogleSignIn?: () => Promise<void>;
  onLogout?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentEmail = '',
  onSelectAccount,
  onGoogleSignIn,
  onLogout
}) => {
  if (!isOpen) return null;

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const registry: AccountsRegistry = getAccountsRegistry();
  const accountsList = Object.entries(registry).map(([email, data]) => ({
    email,
    profile: data.profile
  }));

  const handleSelect = (email: string) => {
    soundFx.playDroplet();
    onSelectAccount(email);
    onClose();
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;

    let email = inputEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      email = `${email}@gmail.com`;
    }

    soundFx.playDroplet();
    onSelectAccount(email, inputName.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111827] text-black dark:text-white border-2 border-black rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scroll">
        
        {/* Header with Google 'G' */}
        <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {/* Google G SVG */}
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-black flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                Přihlášení přes Google
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Přihlas se nebo se zaregistruj přes Gmail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-black dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Google OAuth Button */}
        {onGoogleSignIn && (
          <button
            type="button"
            disabled={isLoadingGoogle}
            onClick={async () => {
              try {
                setIsLoadingGoogle(true);
                soundFx.playDroplet();
                await onGoogleSignIn();
                onClose();
              } catch (err) {
                console.error('Google Sign-in error:', err);
                alert('Přihlášení přes Google selhalo nebo bylo zrušeno.');
              } finally {
                setIsLoadingGoogle(false);
              }
            }}
            className="w-full py-3.5 px-4 bg-white dark:bg-[#111827] border-2 border-black rounded-2xl flex items-center justify-center gap-3 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-98 font-black text-sm text-slate-950 dark:text-white group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoadingGoogle ? 'Otevírám Google...' : 'Pokračovat s účtem Google'}</span>
          </button>
        )}

        {/* Existing Accounts List */}
        {accountsList.length > 0 && !showNewInput && (
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Vyber účet na tomto zařízení
            </label>
            <div className="space-y-2">
              {accountsList.map(({ email, profile }) => {
                const isActive = email.toLowerCase() === currentEmail.toLowerCase();
                return (
                  <button
                    key={email}
                    type="button"
                    onClick={() => handleSelect(email)}
                    className={`w-full p-3 rounded-2xl border-2 flex items-center justify-between text-left transition ${
                      isActive
                        ? 'border-black bg-yellow-50 dark:bg-yellow-400/10 shadow-sm'
                        : 'border-black/20 dark:border-slate-800 hover:border-black bg-white dark:bg-[#1f2937]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatar}
                        alt={profile.username}
                        className="w-10 h-10 rounded-full border border-black object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-slate-950 dark:text-white">
                            {profile.username}
                          </span>
                          {isActive && (
                            <span className="text-[10px] bg-black text-[#facc15] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Aktivní
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {email}
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          Level {profile.rankTitle ? profile.rankTitle.replace('Level ', '') : '1'} • {profile.litersTotal} L
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add another / New account toggle */}
            <button
              type="button"
              onClick={() => setShowNewInput(true)}
              className="w-full py-3 px-4 mt-2 border-2 border-dashed border-black dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Přihlásit se jiným Gmail účtem (nebo nový účet od 0 L)</span>
            </button>
          </div>
        )}

        {/* Form to enter a new / other Gmail */}
        {(showNewInput || accountsList.length === 0) && (
          <form onSubmit={handleNewSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-1.5">
                Tvůj Gmail *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="např. kropic@gmail.com"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#030712] border-2 border-black dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-1.5">
                Jméno nebo přezdívka (volitelné)
              </label>
              <input
                type="text"
                placeholder="např. Kropič z Vysočiny"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#030712] border-2 border-black dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Zero Start Info Callout */}
            <div className="p-3 bg-amber-50 dark:bg-yellow-400/10 border border-black/20 dark:border-yellow-400/30 rounded-2xl text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              💡 <strong>Čistý start od nuly:</strong> Pokud zadáš nový Gmail, tvůj účet začne s <strong>0 litry</strong> a na <strong>Levelu 1 (Dvoulitrovka Braníka)</strong>. Všechny tebou vytvořené spoty uvidí ostatní uživatelé na společné mapě i ve feedu!
            </div>

            <div className="flex gap-2 pt-1">
              {accountsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewInput(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-black dark:text-white font-black text-xs rounded-xl border border-black transition"
                >
                  Zpět na výběr
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 bg-[#facc15] hover:bg-yellow-400 text-black font-black text-xs rounded-xl border-2 border-black shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>Pokračovat s Googlem 🚀</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer actions */}
        {onLogout && currentEmail && (
          <div className="pt-2 border-t border-black/10 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-mono truncate max-w-[200px]">
              {currentEmail}
            </span>
            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                onLogout();
                onClose();
              }}
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Odhlásit</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
