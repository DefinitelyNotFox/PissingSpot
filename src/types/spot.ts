export type CategoryType = 
  | 'view' 
  | 'toilet' 
  | 'kadibudka' 
  | 'toitoi' 
  | 'nature' 
  | 'pub' 
  | 'emergency'
  | 'other';

export type GroundType = 
  | 'mech' 
  | 'trava' 
  | 'sraz' 
  | 'sterk' 
  | 'keramika' 
  | 'vrata';

export type ScopeType = 'me' | 'friends' | 'world';

export interface SpotMetrics {
  view: number;      // 1-5 kapek
  privacy: number;   // 1-5 kapek
  smell: number;     // 1-5 kapek
  wind: number;      // 1-5 kapek (ochrana proti větru)
  amenities: number; // 1-5 kapek (voda/papír/mýdlo)
  splashback: number;// 0-100 %
}

export interface SpotComment {
  id: string;
  author: string;
  authorHandle?: string;
  avatar: string;
  rating: number; // 1-5 kapek
  text: string;
  createdAt: string;
}

export interface Spot {
  id: string;
  title: string;
  category: CategoryType;
  customCategory?: string;
  lat: number;
  lng: number;
  author: string;
  authorHandle: string;
  authorScope: 'me' | 'friends' | 'world';
  rating: number; // 1.0 - 5.0 (průměr všech hodnocení)
  initialRating?: number;
  ratings?: number[];
  reviewsCount: number;
  metrics: SpotMetrics;
  ground: GroundType;
  altitude?: number;
  epiphany?: string;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
  isLiveNow?: boolean;
  liveRemainingSeconds?: number;
  tags?: string[];
  lockCode?: string;
  comments?: SpotComment[];
}

export interface FeedPost {
  id: string;
  spotId: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  timeAgo: string;
  spotTitle: string;
  spotCategory: CategoryType;
  rating: number;
  epiphany: string;
  imageUrl?: string;
  images?: string[];
  distance?: string;
  isLive?: boolean;
  reactions: {
    paper: number;   // 🧻 Podej papír
    skunk: number;   // 🦨 Cítím to sem
    target: number;  // 🎯 Čistý zásah
    respect: number; // 🫡 Respekt
  };
  userReaction?: string;
}

export type AchievementCategory = 'all' | 'nature' | 'night' | 'ballistics' | 'world' | 'social';

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  flavorQuote: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'nature' | 'night' | 'ballistics' | 'world' | 'social';
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  progress?: number;
  maxProgress?: number;
  reward: string;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  handle: string;
  avatar: string;
  title: string;
  liters: number;
  spotsCount: number;
  isCurrentUser?: boolean;
}

export interface PuddleFriend {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  title: string;
  distance: string;
  spotsCount: number;
  isFriend: boolean;
}

export interface UserProfile {
  username: string;
  handle: string;
  email?: string;
  avatar: string;
  rankTitle: string;
  puddleFriendsCount: number;
  puddleFriends: PuddleFriend[];
  litersTotal: number;
  timeTotalMinutes: number;
  spotsCount: number;
  highestAltitude: number;
  lowestAltitude: number;
  hydrationAvg: number;
  privacyZoneRadiusMeters: number;
  soundEnabled: boolean;
  anonymousMode: boolean;
  darkMode: boolean;
  calendarData: { day: number; count: number }[];
}
