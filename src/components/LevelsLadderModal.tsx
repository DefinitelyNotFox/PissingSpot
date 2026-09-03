import React from 'react';
import { X, Trophy, Check, Lock, Zap } from 'lucide-react';
import { PISS_RANK_TIERS, formatLiters } from '../utils/rank';
import { UrineDrop } from './UrineDrop';
import { soundFx } from '../utils/audio';

interface LevelsLadderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLiters: number;
  currentRank: number;
}

export const LevelsLadderModal: React.FC<LevelsLadderModalProps> = ({
  isOpen,
  onClose,
  currentLiters,
  currentRank
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-[#111827] border-t-2 sm:border-2 border-black dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-black/10 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-sm">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base text-black dark:text-white leading-tight">
                Všechny Levely & Nádoby
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                Vyčůráno: <strong className="text-amber-500 dark:text-yellow-400 font-mono">{currentLiters} L</strong> • Level {currentRank}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playDroplet();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Level ladder list */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2.5">
          {PISS_RANK_TIERS.map((tier) => {
            const isCompleted = currentLiters >= tier.nextTargetLiters;
            const isCurrent = tier.rank === currentRank;
            const isLocked = tier.rank > currentRank;

            const remainingToUnlock = Math.max(0, tier.nextTargetLiters - currentLiters);

            return (
              <div
                key={tier.rank}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#facc15]/15 dark:bg-yellow-400/10 border-2 border-black dark:border-yellow-400 shadow-md ring-2 ring-yellow-400/30'
                    : isCompleted
                      ? 'bg-slate-50 dark:bg-[#030712]/40 border border-black/30 dark:border-slate-800 opacity-90'
                      : 'bg-slate-50/50 dark:bg-[#030712]/20 border border-black/15 dark:border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl border border-black flex items-center justify-center text-xl flex-shrink-0 shadow-2xs ${
                      isCurrent
                        ? 'bg-[#facc15] text-black font-black'
                        : isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {tier.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 font-mono">
                          LEVEL {tier.rank}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-black bg-[#facc15] text-black border border-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span>Tvůj Level</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-600/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Splněno</span>
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Od {tier.minLiters} L</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-sm text-black dark:text-white leading-tight mt-0.5">
                        {tier.title}
                      </h4>

                      <p className="text-xs text-amber-700 dark:text-yellow-400 font-bold mt-0.5">
                        🏺 Nádoba: <span className="text-black dark:text-slate-200">{tier.vessel}</span>
                      </p>

                      {/* Popisek levelu */}
                      <p className="text-xs italic text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/10 dark:border-white/10">
                        „{tier.objectDescription}“
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono">
                    <span className="text-xs font-black text-black dark:text-yellow-300 block">
                      {formatLiters(tier.nextTargetLiters)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      kapacita
                    </span>
                  </div>
                </div>

                {/* If Current Level: Show active progress bar and remaining liters */}
                {isCurrent && (
                  <div className="mt-3 pt-2.5 border-t border-black/15 dark:border-yellow-400/20">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-black dark:text-white flex items-center gap-1">
                        <UrineDrop size="xs" />
                        <span>Postup: <strong className="font-mono">{currentLiters} / {formatLiters(tier.nextTargetLiters)}</strong></span>
                      </span>
                      <span className="text-amber-600 dark:text-yellow-400 font-black">
                        zbývá {remainingToUnlock.toLocaleString('cs-CZ')} L do Levelu {tier.rank + 1}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-black/20">
                      <div 
                        className="bg-[#facc15] h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, Math.round(((currentLiters - tier.minLiters) / (tier.nextTargetLiters - tier.minLiters)) * 100)))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#030712]/60 border-t border-black/10 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 font-semibold">
          💡 Za každý zapsaný nebo zalitý spot získáš <strong className="text-black dark:text-yellow-400 font-black">+1 Litr</strong> do postupu!
        </div>
      </div>
    </div>
  );
};
