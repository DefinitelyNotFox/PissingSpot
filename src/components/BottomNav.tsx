import React from 'react';
import { Map, Flame, Trophy, User } from 'lucide-react';

export type TabType = 'map' | 'feed' | 'ranks' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasUnreadFeed?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  return (
    <nav className="h-16 pb-[env(safe-area-inset-bottom,0px)] bg-[var(--bg-app)] border-t border-black dark:border-slate-800 px-6 sm:px-12 flex items-center justify-around z-40 relative transition-colors duration-200">
      
      {/* 1. MAP */}
      <button
        onClick={() => onSelectTab('map')}
        aria-label="Mapa"
        title="Mapa"
        className={`p-3 rounded-2xl transition-all duration-150 transform active:scale-90 flex items-center justify-center relative ${
          activeTab === 'map'
            ? 'text-black dark:text-yellow-400 scale-110'
            : 'text-slate-800 hover:text-black dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Map className="w-6 h-6 stroke-[2.5]" />
        {activeTab === 'map' && (
          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-black dark:bg-yellow-400" />
        )}
      </button>

      {/* 2. ŽIVÝ PROUD */}
      <button
        onClick={() => onSelectTab('feed')}
        aria-label="Živý proud"
        title="Živý proud"
        className={`p-3 rounded-2xl transition-all duration-150 transform active:scale-90 flex items-center justify-center relative ${
          activeTab === 'feed'
            ? 'text-black dark:text-yellow-400 scale-110'
            : 'text-slate-800 hover:text-black dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Flame className="w-6 h-6 stroke-[2.5]" />
        {activeTab === 'feed' && (
          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-black dark:bg-yellow-400" />
        )}
      </button>

      {/* 3. ZLATÁ LIGA */}
      <button
        onClick={() => onSelectTab('ranks')}
        aria-label="Zlatá liga"
        title="Zlatá liga"
        className={`p-3 rounded-2xl transition-all duration-150 transform active:scale-90 flex items-center justify-center relative ${
          activeTab === 'ranks'
            ? 'text-black dark:text-yellow-400 scale-110'
            : 'text-slate-800 hover:text-black dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Trophy className="w-6 h-6 stroke-[2.5]" />
        {activeTab === 'ranks' && (
          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-black dark:bg-yellow-400" />
        )}
      </button>

      {/* 4. PROFIL */}
      <button
        onClick={() => onSelectTab('profile')}
        aria-label="Profil"
        title="Profil"
        className={`p-3 rounded-2xl transition-all duration-150 transform active:scale-90 flex items-center justify-center relative ${
          activeTab === 'profile'
            ? 'text-black dark:text-yellow-400 scale-110'
            : 'text-slate-800 hover:text-black dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <User className="w-6 h-6 stroke-[2.5]" />
        {activeTab === 'profile' && (
          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-black dark:bg-yellow-400" />
        )}
      </button>

    </nav>
  );
};
