import React, { useState, useMemo } from 'react';
import type { LeaderboardUser, Achievement, AchievementCategory, PuddleFriend, UserProfile, Spot } from '../types/spot';
import { Trophy, Lock, CheckCircle2, X } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { getAccountsRegistry } from '../utils/auth';
import { evaluateAchievements } from '../utils/achievements';

const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Všechny', icon: '⚡' },
  { id: 'nature', label: 'Divočina', icon: '🌲' },
  { id: 'night', label: 'Noční kropič', icon: '🍻' },
  { id: 'ballistics', label: 'Balistika', icon: '🎯' },
  { id: 'world', label: 'Světoběžník', icon: '🌍' },
  { id: 'social', label: 'Bratrstvo', icon: '🤝' },
];

interface LeaderboardScreenProps {
  leaderboards: { [scope: string]: LeaderboardUser[] };
  achievements: Achievement[];
  puddleFriends?: PuddleFriend[];
  currentProfile?: UserProfile;
  userPissedSpotIds?: string[];
  spots?: Spot[];
}

const renderAvatar = (avatar?: string, className = "w-full h-full object-cover") => {
  if (!avatar) return '👑';
  if (avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.startsWith('blob:')) {
    return <img src={avatar} alt="Avatar" className={className} />;
  }
  return <span className="select-none">{avatar}</span>;
};

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  leaderboards: _leaderboards,
  achievements: initialAchievements,
  puddleFriends = [],
  currentProfile,
  userPissedSpotIds = [],
  spots = []
}) => {
  const [scope, setScope] = useState<'weekly' | 'total'>('weekly');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');

  const evaluatedAchievements = useMemo(() => {
    return evaluateAchievements(initialAchievements, currentProfile, userPissedSpotIds, spots);
  }, [initialAchievements, currentProfile, userPissedSpotIds, spots]);

  const filteredAchievements = useMemo(() => {
    return evaluatedAchievements
      .filter((a) => selectedCategory === 'all' || a.category === selectedCategory)
      .sort((a, b) => {
        if (selectedCategory === 'all' && a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.tier - b.tier;
      });
  }, [evaluatedAchievements, selectedCategory]);

  const unlockedCount = evaluatedAchievements.filter((a) => a.unlocked).length;

  // V žebříčcích (týdenním i celkovém) se zobrazují přátelé + ty + ostatní registrované Gmail účty
  const users: LeaderboardUser[] = useMemo(() => {
    const activeFriends = puddleFriends.filter((f) => f.isFriend);
    const registry = getAccountsRegistry();
    const otherAccounts: LeaderboardUser[] = Object.entries(registry)
      .filter(([email]) => email.toLowerCase() !== (currentProfile?.email || '').toLowerCase())
      .map(([_, data]) => {
        const liters = scope === 'weekly'
          ? Math.max(0, Math.round(data.profile.litersTotal * 0.4))
          : data.profile.litersTotal;
        const spotsCount = scope === 'weekly'
          ? Math.max(0, Math.round(data.profile.spotsCount * 0.5))
          : data.profile.spotsCount;

        return {
          rank: 0,
          username: data.profile.username,
          handle: data.profile.handle,
          avatar: data.profile.avatar,
          title: 'Kropič',
          liters,
          spotsCount,
          isCurrentUser: false
        };
      });

    const currentLiters = scope === 'weekly'
      ? Math.max(0, Math.round((currentProfile?.litersTotal ?? 0) * 0.4))
      : (currentProfile?.litersTotal ?? 0);
    const currentSpotsCount = scope === 'weekly'
      ? Math.max(0, Math.round((currentProfile?.spotsCount ?? 0) * 0.5))
      : (currentProfile?.spotsCount ?? 0);

    return [
      {
        rank: 1,
        username: currentProfile?.username || 'Kapitán Průtok',
        handle: currentProfile?.handle || '@LordOfStreams',
        avatar: currentProfile?.avatar || '👑',
        title: 'Proudmistr',
        liters: currentLiters,
        spotsCount: currentSpotsCount,
        isCurrentUser: true
      },
      ...otherAccounts,
      ...activeFriends.map((f, idx) => {
        const liters = scope === 'weekly'
          ? Math.max(1, Math.round(f.spotsCount * 0.25))
          : Math.max(1, Math.round(f.spotsCount * 5.8));
        const spotsCount = scope === 'weekly'
          ? Math.max(1, Math.round(f.spotsCount * 0.1))
          : f.spotsCount;

        return {
          rank: idx + 2,
          username: f.username,
          handle: f.handle,
          avatar: f.avatar,
          title: f.title || 'Parťák ve spotu',
          liters,
          spotsCount,
          isCurrentUser: false
        };
      })
    ]
    .sort((a, b) => b.liters - a.liters)
    .map((u, i) => ({
      ...u,
      rank: i + 1,
      title: i === 0 ? 'Proudmistr' : (u.title === 'Proudmistr' ? 'Kropič' : u.title)
    }));
  }, [puddleFriends, currentProfile, scope]);

  const top1 = users.find((u) => u.rank === 1);
  const top2 = users.find((u) => u.rank === 2);
  const top3 = users.find((u) => u.rank === 3);
  const restUsers = users.filter((u) => u.rank > 3);

  return (
    <div className="w-full h-full text-black dark:text-white flex flex-col overflow-y-auto custom-scroll p-4 pb-28 transition-colors duration-150 relative z-10">
      
      {/* Header */}
      <header className="max-w-xl mx-auto w-full pt-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-sm">
            <Trophy className="w-5 h-5 text-black fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black dark:text-white tracking-tight">
              ZLATÁ LIGA
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Největší kropíči
            </p>
          </div>
        </div>

        {/* Scope Tabs: Pouze Týdenní a Celková */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 bg-white dark:bg-[#111827] border-2 border-black dark:border-slate-800 p-1.5 rounded-2xl text-xs text-center font-black shadow-sm">
          <button
            onClick={() => {
              soundFx.playDroplet();
              setScope('weekly');
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              scope === 'weekly'
                ? 'bg-[#facc15] text-black font-black border border-black shadow-sm'
                : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>⚡</span>
            <span className="text-xs sm:text-sm font-black">Týdenní</span>
          </button>

          <button
            onClick={() => {
              soundFx.playDroplet();
              setScope('total');
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              scope === 'total'
                ? 'bg-[#facc15] text-black font-black border border-black shadow-sm'
                : 'text-black dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🏆</span>
            <span className="text-xs sm:text-sm font-black">Celková</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-xl mx-auto w-full space-y-3.5 mt-1">

        {/* PODIUM TOP 3 CARDS */}
        <div className="space-y-2">
          {/* #1 GOLD - PROUDMISTR */}
          {top1 && (
            <div className="bg-white dark:bg-[#111827] border-2 border-black dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-md text-black dark:text-white">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-3xl flex-shrink-0">🥇</span>
                <div className="w-12 h-12 rounded-2xl bg-[#facc15] text-black border-2 border-black font-black text-2xl flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                  {renderAvatar(top1.avatar)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-base text-black dark:text-yellow-300 truncate">{top1.username}</span>
                    {top1.isCurrentUser && (
                      <span className="text-[10px] bg-amber-400 text-black border border-black font-black px-1.5 rounded-full flex-shrink-0">TY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-black bg-[#facc15] text-black px-2.5 py-0.5 rounded-full border border-black shadow-xs flex items-center gap-1 flex-shrink-0">
                      <span>👑</span>
                      <span>Proudmistr</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right font-mono flex-shrink-0 pl-2">
                <div className="font-black text-lg text-black dark:text-yellow-400">{top1.liters} L</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{top1.spotsCount} spotů</div>
              </div>
            </div>
          )}

          {/* #2 SILVER */}
          {top2 && (
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-3xl p-3.5 flex items-center justify-between shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">🥈</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-black text-black dark:text-white font-black flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                  {renderAvatar(top2.avatar)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm text-black dark:text-white truncate">{top2.username}</span>
                    {top2.isCurrentUser && (
                      <span className="text-[10px] bg-amber-400 text-black border border-black font-black px-1.5 rounded-full flex-shrink-0">TY</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold truncate">{top2.title}</div>
                </div>
              </div>
              <div className="text-right font-mono flex-shrink-0 pl-2">
                <div className="font-black text-sm text-black dark:text-slate-200">{top2.liters} L</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{top2.spotsCount} spotů</div>
              </div>
            </div>
          )}

          {/* #3 BRONZE */}
          {top3 && (
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-3xl p-3.5 flex items-center justify-between shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">🥉</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-black text-black dark:text-amber-200 font-black flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                  {renderAvatar(top3.avatar)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm text-black dark:text-yellow-300 truncate">{top3.username}</span>
                    {top3.isCurrentUser && (
                      <span className="text-[10px] bg-amber-400 text-black border border-black font-black px-1.5 rounded-full flex-shrink-0">TY</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-400 font-semibold truncate">{top3.title}</div>
                </div>
              </div>
              <div className="text-right font-mono flex-shrink-0 pl-2">
                <div className="font-black text-sm text-black dark:text-yellow-400">{top3.liters} L</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{top3.spotsCount} spotů</div>
              </div>
            </div>
          )}

          {/* Rest of Users (Rank 4, 5, ...) */}
          {restUsers.map((user) => (
            <div
              key={user.rank + '-' + user.username}
              className="p-3 rounded-2xl bg-white dark:bg-[#111827] border border-black dark:border-slate-800 flex items-center justify-between text-xs shadow-sm text-black dark:text-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-black text-slate-700 dark:text-slate-400 w-5 text-center flex-shrink-0">
                  #{user.rank}
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 border border-black text-black dark:text-white flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0">
                  {renderAvatar(user.avatar)}
                </div>
                <div className="min-w-0 truncate">
                  <span className="font-black text-black dark:text-white">{user.username}</span>
                  {user.isCurrentUser && (
                    <span className="text-[9px] bg-amber-400 text-black border border-black font-black px-1.5 py-0.2 rounded-full ml-1.5">TY</span>
                  )}
                  <span className="text-slate-600 dark:text-slate-400 text-[11px] ml-1.5 font-semibold">({user.title})</span>
                </div>
              </div>
              <div className="font-mono font-black text-black dark:text-white flex-shrink-0 pl-2">{user.liters} L</div>
            </div>
          ))}
        </div>

        {/* SÍŇ POCHCANÉ SLÁVY */}
        <div className="pt-4 border-t-2 border-black/10 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#facc15] text-black border-2 border-black flex items-center justify-center font-black text-lg shadow-xs flex-shrink-0">
                🎖️
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-black dark:text-white tracking-tight leading-tight">
                  SÍŇ POCHCANÉ SLÁVY
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                  Řády zlaté trysky, bojové zásluhy a válečné zářezy
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-black text-black dark:text-yellow-400 bg-white dark:bg-[#111827] border-2 border-black dark:border-slate-800 px-3 py-1 rounded-full shadow-xs">
              {unlockedCount} / {initialAchievements.length}
            </span>
          </div>

          {/* Filtry kategorií */}
          <div className="flex gap-1.5 overflow-x-auto custom-scroll pb-2 pt-1">
            {ACHIEVEMENT_CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? initialAchievements.length
                : initialAchievements.filter((a) => a.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFx.playDroplet();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition border-2 flex-shrink-0 active:scale-95 shadow-2xs ${
                    selectedCategory === cat.id
                      ? 'bg-[#facc15] text-black border-black shadow-xs ring-1 ring-yellow-400/30'
                      : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-black/20 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-70 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Grid achievementů s levely */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {filteredAchievements.map((ach) => (
              <div
                key={ach.id}
                onClick={() => {
                  soundFx.playDroplet();
                  setSelectedAchievement(ach);
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs ${
                  ach.unlocked
                    ? 'bg-white dark:bg-[#111827] border-black dark:border-slate-800 text-black dark:text-white hover:border-amber-500 hover:shadow-md'
                    : 'bg-white/60 dark:bg-[#111827]/40 border-black/20 dark:border-slate-800/50 text-slate-700 dark:text-slate-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Top Bar: Tier badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black tracking-wider uppercase font-mono px-2 py-0.5 rounded-full border border-black/30 bg-[#facc15]/25 dark:bg-yellow-400/20 text-black dark:text-yellow-300">
                      LEVEL {['I', 'II', 'III', 'IV'][ach.tier - 1]} • {ach.tierName.split(' - ')[1] || ''}
                    </span>

                    {ach.unlocked ? (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SPLNĚNO</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        <span>ZAMČENO</span>
                      </span>
                    )}
                  </div>

                  {/* Icon + Title + Description */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl border-2 border-black flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs ${
                      ach.unlocked ? 'bg-[#facc15]' : 'bg-slate-100 dark:bg-slate-800 grayscale opacity-70'
                    }`}>
                      {ach.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm text-black dark:text-white truncate leading-tight">
                        {ach.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-2 mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Satirical Quote Bubble */}
                  <div className="mt-2.5 bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800 text-[11px] italic text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    „{ach.flavorQuote}“
                  </div>
                </div>

                {/* Progress bar or Reward */}
                <div className="mt-2.5 pt-2 border-t border-black/10 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-amber-600 dark:text-yellow-400 truncate max-w-[190px]">
                    🎁 {ach.reward}
                  </span>

                  {ach.maxProgress && ach.maxProgress > 1 && (
                    <span className="font-mono font-black text-black dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md border border-black/15">
                      {ach.progress ?? (ach.unlocked ? ach.maxProgress : 0)} / {ach.maxProgress}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="bg-white dark:bg-[#111827] text-black dark:text-white border-2 border-black rounded-3xl p-6 max-w-sm w-full space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Zavřít"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#facc15] border-2 border-black flex items-center justify-center text-4xl shadow-sm mx-auto mb-2">
                {selectedAchievement.icon}
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full border border-black/30 bg-[#facc15]/25 text-black dark:text-yellow-300">
                {selectedAchievement.tierName}
              </span>

              <h3 className="text-lg font-black mt-1 text-black dark:text-white">
                {selectedAchievement.title}
              </h3>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#030712]/50 rounded-2xl border border-black/10 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Zadání úkolu:</span>
              <p className="text-xs text-black dark:text-slate-200 font-semibold leading-relaxed">
                {selectedAchievement.description}
              </p>
            </div>

            {/* Quote Bubble */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-300 dark:border-amber-700/30 text-xs italic text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
              „{selectedAchievement.flavorQuote}“
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-slate-600 dark:text-slate-400">Odměna:</span>
              <span className="text-amber-600 dark:text-yellow-400 font-black">{selectedAchievement.reward}</span>
            </div>

            <div className="pt-1 text-center">
              <span className={`text-xs font-black px-3.5 py-1 rounded-full border border-black inline-flex items-center gap-1.5 shadow-2xs ${
                selectedAchievement.unlocked
                  ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {selectedAchievement.unlocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Odemčeno {selectedAchievement.unlockedAt ? `(${selectedAchievement.unlockedAt})` : '✓'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Dosud nezískáno ({selectedAchievement.progress || 0} / {selectedAchievement.maxProgress || 1})</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="w-full mt-2 py-2.5 bg-[#facc15] hover:bg-yellow-400 text-black font-black rounded-xl text-xs border-2 border-black shadow-xs transition active:scale-95"
            >
              Rozumím, jdu kropit! 💦
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
