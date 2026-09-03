import React, { useState, useRef } from 'react';
import type { UserProfile, Spot } from '../types/spot';
import { 
  Clock, 
  Mountain, 
  Volume2, 
  Moon,
  Sun,
  Edit3,
  Search,
  Check,
  Plus,
  X,
  Camera,
  Globe
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { UrineDrop } from '../components/UrineDrop';
import { CountryFlag } from '../components/CountryFlag';
import { LevelsLadderModal } from '../components/LevelsLadderModal';
import { GoogleAuthModal } from '../components/GoogleAuthModal';
import { getPissRank, getCountryForSpot, type PissCountry } from '../utils/rank';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSwitchAccount?: (email: string, name?: string) => void;
  onGoogleSignIn?: () => Promise<void>;
  onLogout?: () => void;
  spots?: Spot[];
  userPissedSpotIds?: string[];
}

const EMOJI_AVATARS = ['👑', '🦁', '🧙‍♂️', '🤠', '⚡', '🥷', '🏄‍♂️', '🚀', '🍺', '🚽', '🎯', '🌲', '🫡', '🗿'];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onSwitchAccount,
  onGoogleSignIn,
  onLogout,
  spots = [],
  userPissedSpotIds = []
}) => {
  const [soundEnabled, setSoundEnabled] = useState(profile.soundEnabled);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.username);
  const [editAvatar, setEditAvatar] = useState(profile.avatar);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Puddle Friends Modal State ("Bratři a sestry v louži")
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Levels & Vessels Overview Modal State
  const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);

  // Google Auth Modal State
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playDroplet();
    onUpdateProfile({ soundEnabled: next });
  };

  const toggleDarkMode = () => {
    soundFx.playDroplet();
    onUpdateProfile({ darkMode: !profile.darkMode });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playDroplet();
    if (!editName.trim()) return;
    onUpdateProfile({
      username: editName.trim(),
      avatar: editAvatar
    });
    setIsEditModalOpen(false);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        soundFx.playDroplet();
        setEditAvatar(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleFriend = (friendId: string) => {
    soundFx.playDroplet();
    const updated = (profile.puddleFriends || []).map((f) =>
      f.id === friendId ? { ...f, isFriend: !f.isFriend } : f
    );
    const count = updated.filter((f) => f.isFriend).length;
    onUpdateProfile({
      puddleFriends: updated,
      puddleFriendsCount: count
    });
  };

  const filteredFriends = (profile.puddleFriends || []).filter(
    (f) =>
      f.username.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.handle.toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.title.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const rankInfo = getPissRank(profile.litersTotal);

  // Compute distinct countries where user has recorded a piss
  const pissedSpots = spots.filter(
    (s) =>
      (profile.handle && s.authorHandle && s.authorHandle.toLowerCase() === profile.handle.toLowerCase()) ||
      userPissedSpotIds.includes(s.id)
  );

  const countryMap = new Map<string, PissCountry>();
  pissedSpots.forEach((s) => {
    const c = getCountryForSpot(s);
    countryMap.set(c.code, c);
  });

  const pissedCountries = Array.from(countryMap.values());

  return (
    <div className="w-full h-full text-black dark:text-white flex flex-col overflow-y-auto custom-scroll p-4 pb-28 transition-colors duration-150 relative z-10">
      
      <div className="max-w-xl mx-auto w-full space-y-4 pt-2">

        {/* User Card - Guaranteed White with clean black border and refined typography */}
        <div className="bg-white dark:bg-[#111827] border-2 border-black dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md text-black dark:text-white space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div 
                onClick={() => {
                  soundFx.playDroplet();
                  setIsEditModalOpen(true);
                }}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl sm:rounded-3xl bg-[#facc15] text-black font-black text-3xl flex items-center justify-center border-2 border-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition overflow-hidden relative group flex-shrink-0"
                title="Změnit profilový obrázek"
              >
                {profile.avatar && (profile.avatar.startsWith('data:image') || profile.avatar.startsWith('http') || profile.avatar.startsWith('blob:')) ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.avatar || '👑'
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                  ✏️
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl sm:text-2xl text-black dark:text-white tracking-tight truncate">
                    {profile.username}
                  </h3>
                  <button
                    onClick={() => {
                      soundFx.playDroplet();
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
                    title="Přejmenovat se"
                  >
                    <Edit3 className="w-4 h-4 stroke-[2.4]" />
                  </button>
                </div>
                {/* Black Level: "Level 2" */}
                <p className="text-sm sm:text-base font-black text-black dark:text-white tracking-wide mt-0.5 truncate">
                  Level {rankInfo.rank}
                </p>
              </div>
            </div>

            {/* XP Indicator ("L" litry) napravo od jména a ranku - KLIKACÍ */}
            <div 
              onClick={() => {
                soundFx.playDroplet();
                setIsLevelsModalOpen(true);
              }}
              className="flex-shrink-0 text-right flex flex-col items-end pl-2 cursor-pointer group"
              title="Klikni pro přehled všech levelů a nádob"
            >
              <div className="flex items-center gap-2 bg-[#facc15]/25 hover:bg-[#facc15]/40 dark:bg-[#facc15]/20 dark:hover:bg-[#facc15]/30 border-2 border-black dark:border-yellow-400/60 px-3.5 py-1.5 rounded-2xl shadow-xs transition group-hover:scale-105 active:scale-95">
                <UrineDrop size="sm" />
                <span className="font-mono font-black text-sm sm:text-base text-black dark:text-yellow-300">
                  {rankInfo.xpText}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-24 sm:w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5 border border-black/30">
                <div 
                  className="bg-[#facc15] h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${rankInfo.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1 group-hover:text-black dark:group-hover:text-yellow-400 transition">
                do dalšího levelu
              </span>
            </div>
          </div>

          {/* BRATŘI A SESTRY V LOUŽI - CLEAN MODERN STYLE */}
          <div className="pt-3.5 border-t border-black/10 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setIsFriendsModalOpen(true);
              }}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition group py-1"
            >
              <span className="text-2xl group-hover:scale-110 transition transform">🤝</span>
              <span className="text-sm sm:text-base font-black text-black dark:text-white tracking-tight">
                Bratři a sestry v louži:{' '}
                <strong className="text-base sm:text-lg font-black text-amber-500 dark:text-yellow-400 ml-1">
                  {profile.puddleFriendsCount}
                </strong>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setIsFriendsModalOpen(true);
              }}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-[#facc15] dark:bg-slate-800 dark:hover:bg-yellow-400/20 text-black dark:text-white border border-black/20 hover:border-black shadow-xs transition active:scale-95 flex items-center justify-center"
              title="Hledat v okolí"
              aria-label="Hledat v okolí"
            >
              <Search className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>

          {/* GOOGLE / GMAIL LOGIN BUTTON & STATUS */}
          <div className="pt-3 border-t border-black/10 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setIsGoogleAuthOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-white dark:bg-[#030712] border-2 border-black dark:border-slate-700 hover:border-black flex items-center justify-between shadow-xs transition hover:shadow-sm group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Google G SVG */}
                <div className="w-7 h-7 rounded-xl bg-white border border-black/30 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                <div className="text-left min-w-0">
                  <div className="text-xs font-black text-black dark:text-white flex items-center gap-1.5">
                    {profile.email ? 'Přihlášen přes Google' : 'Přihlásit se přes Google'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {profile.email || 'Zaregistruj se nebo přepni účet'}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-black bg-[#facc15] hover:bg-yellow-400 text-black px-2.5 py-1 rounded-xl border border-black group-hover:scale-105 transition flex-shrink-0">
                {profile.email ? 'Změnit účet' : 'Přihlásit se'}
              </span>
            </button>
          </div>
        </div>

        {/* ABSURDNÍ STATISTIKY - DIRECT GRID */}
        <div className="grid grid-cols-2 gap-2">
            
            {/* Stat 1 - Vypuštěná nádrž */}
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
                <UrineDrop size="xs" /> Vypuštěná nádrž
              </div>
              <div className="text-2xl font-black font-mono text-black dark:text-yellow-400">
                {profile.litersTotal} L
              </div>
              <p className="text-[11px] font-bold text-black dark:text-white leading-snug">
                {rankInfo.filledVesselText}
              </p>
            </div>

            {/* Stat 2 - Prochcané minuty */}
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-black dark:text-cyan-400" /> Prochcané minuty
              </div>
              <div className="text-xl font-black font-mono text-black dark:text-amber-400">
                {profile.timeTotalMinutes ?? 0} min
              </div>
            </div>

            {/* Stat 3 - Vertikální dostřel */}
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
                <Mountain className="w-3.5 h-3.5 text-black dark:text-emerald-400" /> Vertikální dostřel
              </div>
              <div className="text-base font-black font-mono text-black dark:text-emerald-400">
                {profile.spotsCount > 0 ? `${profile.lowestAltitude}m ➔ ${profile.highestAltitude}m` : '0 m'}
              </div>
            </div>

            {/* Stat 4 - Pochcané státy */}
            <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm text-black dark:text-white">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
                <Globe className="w-3.5 h-3.5 text-amber-500 dark:text-yellow-400" /> Pochcané státy
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black font-mono text-black dark:text-yellow-400">
                  {pissedCountries.length}
                </span>
                <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                  {pissedCountries.length === 1 ? 'stát' : (pissedCountries.length >= 2 && pissedCountries.length <= 4) ? 'státy' : 'států'}
                </span>
              </div>
              {pissedCountries.length > 0 ? (
                <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto custom-scroll pb-0.5">
                  {pissedCountries.map((c) => (
                    <div 
                      key={c.code} 
                      title={c.name} 
                      className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-black/20 dark:border-slate-700 shadow-2xs hover:scale-105 transition transform cursor-pointer flex-shrink-0"
                    >
                      <CountryFlag code={c.code} name={c.name} size="md" />
                      <span className="text-[11px] font-black text-black dark:text-white leading-none">
                        {c.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic pt-1">
                  Zatím žádný zářez v mapě světa
                </p>
              )}
            </div>

          </div>

        {/* NASTAVENÍ */}
        <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-3xl p-2 shadow-sm divide-y divide-black/10 dark:divide-white/10 text-xs text-black dark:text-white">
          
          {/* THEME TOGGLE: SVĚTLÝ ŽLUTÝ VS NOČNÍ TMAVÝ */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {profile.darkMode ? (
                <Moon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 text-black flex-shrink-0" />
              )}
              <div>
                <div className="font-black text-black dark:text-white">
                  {profile.darkMode ? 'Noční režim (Tmavý)' : 'Normální režim (Zlatavě žlutý)'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {profile.darkMode ? 'Přepnout na denní zlatavě žlutou' : 'Přepnout na noční tmavý vzhled'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="px-3.5 py-1.5 rounded-xl font-black bg-[#facc15] hover:bg-yellow-400 text-black border border-black shadow-sm transition transform active:scale-95 flex items-center gap-1.5"
            >
              {profile.darkMode ? (
                <><span>☀️</span><span>Zlatý denní</span></>
              ) : (
                <><span>🌙</span><span>Noční tmavý</span></>
              )}
            </button>
          </div>

          {/* PLOŠNÉ ZVUKY APLIKACE */}
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-black dark:text-yellow-400 flex-shrink-0" />
              <div>
                <div className="font-black text-black dark:text-white">Zvuky aplikace (plošně)</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Zapnout nebo vypnout veškeré zvuky v celé aplikaci
                </div>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3.5 py-1.5 rounded-xl font-black border border-black transition ${
                soundEnabled
                  ? 'bg-[#facc15] text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? 'Zapnuto 🔊' : 'Vypnuto 🔇'}
            </button>
          </div>

        </div>

      </div>

      {/* 1. MODAL: PŘEJMENOVÁNÍ & VÝBĚR PROFILOVÉHO OBRÁZKU */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] text-black dark:text-white border-2 border-black rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Upravit svůj profil</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1.5 text-black dark:text-white">
                  Tvé jméno / Přezdívka
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-black rounded-xl p-2.5 text-sm font-bold text-black dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1.5 text-black dark:text-white">
                  Profilový obrázek / Avatar
                </label>
                
                {/* Emoji Avatars Grid */}
                <div className="grid grid-cols-7 gap-1.5 mb-2.5">
                  {EMOJI_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        soundFx.playDroplet();
                        setEditAvatar(emoji);
                      }}
                      className={`h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                        editAvatar === emoji
                          ? 'bg-amber-400 border-black ring-2 ring-black'
                          : 'bg-slate-100 dark:bg-slate-800 border-black/20 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Upload custom avatar */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-black dark:text-white border border-black rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Nahrát vlastní fotku</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-black dark:text-white border border-black rounded-xl text-xs font-black"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#facc15] hover:bg-yellow-400 text-black border border-black rounded-xl text-xs font-black shadow"
                >
                  Uložit změny
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: VYHLEDÁVÁNÍ BRATRŮ A SESTER V LOUŽI V OKOLÍ */}
      {isFriendsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] text-black dark:text-white border-2 border-black rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="text-base font-black leading-tight">Bratři a sestry v louži</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Kropiči a spřízněné duše v okolí</p>
                </div>
              </div>
              <button 
                onClick={() => setIsFriendsModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Hledat přátele podle jména či titulu..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-black rounded-xl text-xs font-bold text-black dark:text-white focus:outline-none"
              />
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-slate-50 dark:bg-slate-900 border border-black/20 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-black flex items-center justify-center text-xl font-bold shadow-sm">
                      {friend.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-black dark:text-white">{friend.username}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{friend.handle}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-black dark:text-yellow-400">{friend.title}</span>
                        <span>•</span>
                        <span>📍 {friend.distance}</span>
                        <span>•</span>
                        <span>{friend.spotsCount} spotů</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFriend(friend.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border border-black shadow-sm transition active:scale-95 flex items-center gap-1 ${
                      friend.isFriend
                        ? 'bg-amber-300 text-black hover:bg-amber-400'
                        : 'bg-[#facc15] hover:bg-yellow-400 text-black'
                    }`}
                  >
                    {friend.isFriend ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>V louži</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Přidat</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-600 dark:text-slate-400 border-t border-black/10 font-medium">
              💡 Nové bratry a sestry můžeš také přidat kliknutím na jejich spot na mapě či ve feedu!
            </div>

          </div>
        </div>
      )}

      {/* Overview of All Levels & Vessels Modal */}
      <LevelsLadderModal
        isOpen={isLevelsModalOpen}
        onClose={() => setIsLevelsModalOpen(false)}
        currentLiters={profile.litersTotal}
        currentRank={rankInfo.rank}
      />

      {/* Google Sign-In & Accounts Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        currentEmail={profile.email}
        onSelectAccount={(email, name) => {
          if (onSwitchAccount) {
            onSwitchAccount(email, name);
          }
        }}
        onGoogleSignIn={onGoogleSignIn}
        onLogout={onLogout}
      />

    </div>
  );
};
