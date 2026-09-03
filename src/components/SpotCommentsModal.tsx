import React, { useState } from 'react';
import type { Spot, SpotComment } from '../types/spot';
import { X, MessageSquare, Send, Sparkles } from 'lucide-react';
import { UrineRating, UrineDrop } from './UrineDrop';
import { soundFx } from '../utils/audio';

interface SpotCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: Spot;
  onAddComment: (spotId: string, comment: SpotComment) => void;
  currentUser?: {
    username: string;
    avatar: string;
  };
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: '1/5 • Nouzovka / Horší odraz 😬',
  2: '2/5 • Průměr / Nic moc 😐',
  3: '3/5 • Dobrý standard 💧',
  4: '4/5 • Skvělý proud & krytí 🎯',
  5: '5/5 • Božský revír & Legenda! 👑'
};

const DEFAULT_COMMENTS_BY_CATEGORY: Record<string, SpotComment[]> = {
  view: [
    {
      id: 'c1',
      author: 'Honza "Orel"',
      authorHandle: '@honza_orel',
      avatar: '🦅',
      rating: 5,
      text: 'Stát tady a koukat do údolí je naprostá extáze. Vítr do zad, nulový odraz a ten výhled!',
      createdAt: 'Před 2 dny'
    },
    {
      id: 'c2',
      author: 'Petr_Kropič',
      authorHandle: '@petr_stromovka',
      avatar: '🌲',
      rating: 5,
      text: 'Naprostá pecka. Revír označen, doporučuji za soumraku.',
      createdAt: 'Před 5 dny'
    }
  ],
  pub: [
    {
      id: 'c3',
      author: 'Kropič Bohumil',
      authorHandle: '@bohumil_pilsen',
      avatar: '🍺',
      rating: 4,
      text: 'Po třech plzních naprostá spása. Mušle čistá, splachování má tah.',
      createdAt: 'Před 1 dnem'
    }
  ],
  nature: [
    {
      id: 'c4',
      author: 'Michal Horal',
      authorHandle: '@michal_ninja',
      avatar: '🥷',
      rating: 5,
      text: 'Měkké jehličí a mech, dokonalé ASMR a ninja ticho. Přesně takhle má vypadat lesní spot.',
      createdAt: 'Před 3 dny'
    }
  ],
  kadibudka: [
    {
      id: 'c5',
      author: 'Eliška K.',
      authorHandle: '@eliska_k',
      avatar: '🌸',
      rating: 5,
      text: 'Výhled přes vyřezané srdce na ranní opar je k nezaplacení. Toaletní papír byl!',
      createdAt: 'Před týdnem'
    }
  ],
  toitoi: [
    {
      id: 'c6',
      author: 'Toilet Hunter',
      authorHandle: '@wc_prague',
      avatar: '🚽',
      rating: 2,
      text: 'V nouzi nejvyšší záchrana života, kód na zámku seděl. Nezapomeňte si vzít kapesníčky.',
      createdAt: 'Před 4 dny'
    }
  ]
};

const renderAvatar = (avatar?: string) => {
  if (!avatar) return '👤';
  if (avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.startsWith('blob:')) {
    return <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />;
  }
  return <span>{avatar}</span>;
};

export const SpotCommentsModal: React.FC<SpotCommentsModalProps> = ({
  isOpen,
  onClose,
  spot,
  onAddComment,
  currentUser = { username: 'Kapitán Průtok', avatar: '👑' }
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const activeRating = hoverRating || rating;
  const existingComments = spot.comments && spot.comments.length > 0 
    ? spot.comments 
    : (DEFAULT_COMMENTS_BY_CATEGORY[spot.category] || [
        {
          id: 'c-default',
          author: 'Zvěd z terénu',
          authorHandle: '@zved_pruzkumnik',
          avatar: '⚡',
          rating: Math.round(spot.rating),
          text: spot.epiphany || 'Revír zkontrolován a zalit. Podmínky vyhovující.',
          createdAt: 'Nedávno'
        }
      ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    soundFx.playFlush();

    const newComment: SpotComment = {
      id: `comment-${Date.now()}`,
      author: currentUser.username,
      authorHandle: '@' + currentUser.username.toLowerCase().replace(/\s+/g, '_'),
      avatar: currentUser.avatar,
      rating,
      text: commentText.trim(),
      createdAt: 'Právě teď'
    };

    onAddComment(spot.id, newComment);
    setCommentText('');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-[#111827] border-t-2 sm:border-2 border-black dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-black dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-black/10 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-sm">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base text-black dark:text-white leading-tight">
                Hodnocení & Komentáře
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[220px]">
                {spot.title}
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

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
          
          {/* Current Spot Rating Banner */}
          <div className="bg-[#facc15]/15 border-2 border-black dark:border-yellow-400/40 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-yellow-400">
                Průměrné hodnocení revíru
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-mono font-black text-black dark:text-yellow-400">
                  {spot.rating.toFixed(1)}
                </span>
                <UrineRating rating={spot.rating} size="sm" />
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-black text-slate-800 dark:text-slate-300">
                {spot.reviewsCount} zářezů
              </span>
              <p className="text-[10px] text-slate-500 font-medium">od kropičů z louže</p>
            </div>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-[#1f2937]/50 border-2 border-black dark:border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-black dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tvoje hodnocení spotu:
              </span>
              <span className="text-[11px] font-mono font-black text-amber-600 dark:text-yellow-400">
                {activeRating} / 5
              </span>
            </div>

            {/* Clickable Urine Drops Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-black dark:border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => setHoverRating(val)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => {
                      soundFx.playDroplet();
                      setRating(val);
                    }}
                    className="p-1 rounded-lg hover:scale-125 active:scale-95 transition transform"
                    title={`${val} kapek`}
                  >
                    <UrineDrop 
                      size="md" 
                      filled={activeRating >= val} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-2 truncate text-right">
                {RATING_DESCRIPTIONS[activeRating]}
              </span>
            </div>

            {/* Comment Textarea */}
            <div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Jaké to bylo? (vítr, proud, čistota, soukromí, odraz, výhled)..."
                rows={3}
                className="w-full bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-xl p-3 text-xs text-black dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none font-medium"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className={`w-full py-2.5 px-4 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                commentText.trim()
                  ? 'bg-[#facc15] hover:bg-yellow-400 text-black active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-black/30 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>PŘIDAT KOMENTÁŘ & HODNOCENÍ</span>
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>💬</span> Zkušenosti kropičů ({existingComments.length})
            </h4>

            {existingComments.map((c) => (
              <div 
                key={c.id} 
                className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-3 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#facc15] text-black border border-black flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0">
                      {renderAvatar(c.avatar)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-xs text-black dark:text-white truncate block">
                        {c.author}
                      </span>
                      {c.authorHandle && (
                        <span className="text-[10px] text-slate-500 block truncate">
                          {c.authorHandle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <UrineRating rating={c.rating} size="xs" />
                    <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                      {c.createdAt}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed pl-1">
                  "{c.text}"
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
