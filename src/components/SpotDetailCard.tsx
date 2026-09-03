import React, { useState } from 'react';
import type { Spot, PuddleFriend, SpotComment } from '../types/spot';
import { X, Wind, Shield, Sparkles, MessageSquare, Lock, Check } from 'lucide-react';
import { UrineRating, UrineDrop } from './UrineDrop';
import { SpotCommentsModal } from './SpotCommentsModal';
import { soundFx } from '../utils/audio';

interface SpotDetailCardProps {
  spot: Spot;
  onClose: () => void;
  onQuickPiss: (spot: Spot) => void;
  puddleFriends?: PuddleFriend[];
  onTogglePuddleFriend?: (authorData: { username: string; handle: string; avatar: string }) => void;
  userPissedSpotIds?: string[];
  onAddComment?: (spotId: string, comment: SpotComment) => void;
  currentUser?: {
    username: string;
    avatar: string;
  };
}

const CATEGORY_MAP: Record<Spot['category'], { label: string; icon: string }> = {
  view: { label: 'Outdoor & Výhled', icon: '⛰️' },
  toilet: { label: 'Veřejné WC', icon: '🚻' },
  kadibudka: { label: 'Dřevěná kadibudka', icon: '🛖' },
  toitoi: { label: 'Toi-Toi Buňka', icon: '🚽' },
  nature: { label: 'Přírodní zákoutí', icon: '🌲' },
  pub: { label: 'Hospoda / Kavárna', icon: '🍺' },
  emergency: { label: 'Městská nouzovka', icon: '⚠️' },
  other: { label: 'Jiné', icon: '✨' }
};

const GROUND_MAP: Record<Spot['ground'], string> = {
  mech: 'Mech / listí',
  trava: 'Tráva / hlína',
  sraz: 'Skalní sráz',
  sterk: 'Štěrk',
  keramika: 'Keramika / mušle',
  vrata: 'Plechová vrata'
};

export const SpotDetailCard: React.FC<SpotDetailCardProps> = ({
  spot,
  onClose,
  onQuickPiss,
  puddleFriends = [],
  onTogglePuddleFriend,
  userPissedSpotIds = [],
  onAddComment,
  currentUser
}) => {
  const cat = spot.category === 'other' && spot.customCategory 
    ? { label: spot.customCategory, icon: '✨' }
    : (CATEGORY_MAP[spot.category] || { label: 'Spot', icon: '⚡' });
  const allImages = spot.images && spot.images.length > 0 
    ? spot.images 
    : spot.imageUrl 
      ? [spot.imageUrl] 
      : [];

  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const isCurrentUser = spot.author.includes('Ty') || spot.authorHandle === '@LordOfStreams';
  const isPuddleFriend = puddleFriends.some(
    (f) => f.isFriend && (f.handle.toLowerCase() === spot.authorHandle.toLowerCase() || f.username === spot.author)
  );
  const isPissed = spot.authorScope === 'me' || userPissedSpotIds.includes(spot.id);

  return (
    <div className="absolute bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 max-w-lg bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-3xl p-5 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-6 duration-200 text-black dark:text-white">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-yellow-400/20 border border-black dark:border-yellow-400/40 flex items-center justify-center text-2xl shadow-sm">
            {cat.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-yellow-400">
                {cat.label}
              </span>
              {spot.altitude && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                  • {spot.altitude} m n. m.
                </span>
              )}
            </div>
            <h3 className="font-black text-sm text-black dark:text-white leading-tight">
              {spot.title}
            </h3>
            
            {/* Yellow Urine Droplets Rating */}
            <div className="flex items-center gap-1.5 mt-1">
              <UrineRating rating={spot.rating} size="sm" />
              <span className="text-black dark:text-yellow-400 text-xs font-black">
                {spot.rating.toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                ({spot.reviewsCount} zářezů)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-700 hover:text-black dark:text-slate-400 dark:hover:text-white transition"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lock Code if exists */}
      {spot.lockCode && (
        <div className="mt-2.5 bg-amber-50 dark:bg-yellow-400/10 border border-black dark:border-yellow-400/30 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-amber-950 dark:text-yellow-300">
          <span className="flex items-center gap-1.5 font-black">
            <Lock className="w-3.5 h-3.5" /> Kód na zámku:
          </span>
          <span className="font-mono font-black text-sm bg-[#facc15] text-black px-2 py-0.5 rounded border border-black">
            {spot.lockCode}
          </span>
        </div>
      )}

      {/* Author Card with "+ Přidat do louže" */}
      {!isCurrentUser && (
        <div className="mt-2.5 bg-slate-50 dark:bg-[#030712]/60 border border-black dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤝</span>
            <div>
              <div className="text-xs font-black text-black dark:text-white leading-tight">
                {spot.author}
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                {spot.authorHandle}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTogglePuddleFriend?.({
              username: spot.author,
              handle: spot.authorHandle,
              avatar: '🤝'
            })}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border border-black shadow-sm transition active:scale-95 flex items-center gap-1 ${
              isPuddleFriend
                ? 'bg-amber-300 text-black hover:bg-amber-400'
                : 'bg-[#facc15] hover:bg-yellow-400 text-black'
            }`}
          >
            <span>{isPuddleFriend ? '✓ V louži' : '+ Do louže'}</span>
          </button>
        </div>
      )}

      {/* Photo gallery preview if spot has photos */}
      {allImages.length > 0 && (
        <div className="mt-2.5">
          <div className="flex gap-1.5 overflow-x-auto custom-scroll pb-1">
            {allImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Foto spotu"
                onClick={() => setActivePhotoIdx(i)}
                className="w-16 h-16 rounded-xl object-cover border border-black flex-shrink-0 cursor-pointer hover:opacity-90"
              />
            ))}
          </div>
        </div>
      )}

      {/* 4-Metric Grid with Yellow Drops */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 text-center text-[10px] font-mono">
        <div className="bg-slate-50 dark:bg-[#030712]/60 p-2 rounded-xl border border-black dark:border-slate-800">
          <div className="text-slate-700 dark:text-slate-400 flex items-center justify-center gap-0.5 font-bold">
            <Sparkles className="w-3 h-3 text-amber-500" /> VÝHLED
          </div>
          <div className="font-black text-black dark:text-yellow-400 mt-0.5 flex items-center justify-center gap-0.5">
            <span>{spot.metrics.view}</span>
            <UrineDrop size="xs" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#030712]/60 p-2 rounded-xl border border-black dark:border-slate-800">
          <div className="text-slate-700 dark:text-slate-400 flex items-center justify-center gap-0.5 font-bold">
            <Shield className="w-3 h-3 text-emerald-600" /> KRYTÍ
          </div>
          <div className="font-black text-black dark:text-slate-200 mt-0.5 flex items-center justify-center gap-0.5">
            <span>{spot.metrics.privacy}</span>
            <UrineDrop size="xs" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#030712]/60 p-2 rounded-xl border border-black dark:border-slate-800">
          <div className="text-slate-700 dark:text-slate-400 flex items-center justify-center gap-0.5 font-bold">
            <Wind className="w-3 h-3 text-blue-600" /> ZÁVĚTŘÍ
          </div>
          <div className="font-black text-black dark:text-blue-300 mt-0.5 flex items-center justify-center gap-0.5">
            <span>{spot.metrics.wind}</span>
            <UrineDrop size="xs" />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-[#030712]/60 p-2 rounded-xl border border-black dark:border-slate-800">
          <div className="text-slate-700 dark:text-slate-400 flex items-center justify-center gap-0.5 font-bold">
            <span>💦</span> ODRAZ
          </div>
          <div className="font-black text-black dark:text-cyan-300 mt-0.5">{spot.metrics.splashback} %</div>
        </div>
      </div>

      {/* Ground type */}
      <div className="mt-2 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between px-1 font-semibold">
        <span>Podloží: <strong className="text-black dark:text-white font-black">{GROUND_MAP[spot.ground]}</strong></span>
        {isCurrentUser && <span className="text-slate-600 dark:text-slate-400">(Tvůj spot)</span>}
      </div>

      {/* Epiphany */}
      {spot.epiphany && (
        <div className="mt-2.5 bg-slate-50 dark:bg-[#030712]/60 border border-black dark:border-slate-800 rounded-2xl p-2.5 text-[11px] text-slate-900 dark:text-slate-200 italic font-medium">
          <span className="font-black not-italic text-black dark:text-yellow-400 mr-1">💭 Epifanie:</span>
          "{spot.epiphany}"
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3.5 flex gap-2">
        <button
          onClick={() => onQuickPiss(spot)}
          className={`flex-1 py-2.5 font-black text-xs rounded-xl border border-black flex items-center justify-center gap-1.5 transition transform active:scale-95 ${
            isPissed
              ? 'bg-[#facc15] hover:bg-amber-400 text-black shadow-sm'
              : 'bg-white hover:bg-slate-100 text-black shadow-sm'
          }`}
        >
          {isPissed ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>ZALITO</span>
            </>
          ) : (
            <>
              <span>💧</span>
              <span>ZALÍT</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundFx.playDroplet();
            setIsCommentsOpen(true);
          }}
          className="px-3.5 py-2.5 bg-[#facc15] hover:bg-yellow-400 text-black border border-black rounded-xl text-xs flex items-center justify-center transition shadow-sm active:scale-95"
          title="Komentáře a vlastní hodnocení spotu"
          aria-label="Komentáře a vlastní hodnocení spotu"
        >
          <MessageSquare className="w-4.5 h-4.5 fill-current" />
        </button>
      </div>

      {/* Spot Comments & Rating Modal */}
      <SpotCommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        spot={spot}
        onAddComment={(spotId, comment) => {
          onAddComment?.(spotId, comment);
        }}
        currentUser={currentUser}
      />

      {/* Full Photo Modal Preview */}
      {activePhotoIdx !== null && (
        <div 
          onClick={() => setActivePhotoIdx(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img 
            src={allImages[activePhotoIdx]} 
            alt="Náhled" 
            className="max-w-full max-h-[85vh] rounded-2xl object-contain border-2 border-white shadow-2xl" 
          />
        </div>
      )}

    </div>
  );
};
