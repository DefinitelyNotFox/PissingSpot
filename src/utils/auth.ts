import type { UserProfile } from '../types/spot';
import { initialProfile } from '../data/initialData';
import { getPissRank } from './rank';

const REGISTRY_STORAGE_KEY = 'pissing_accounts_registry';
const ACTIVE_EMAIL_STORAGE_KEY = 'pissing_active_email';

export interface AccountData {
  profile: UserProfile;
  userPissedSpotIds: string[];
}

export type AccountsRegistry = Record<string, AccountData>;

let memoryRegistry: AccountsRegistry | null = null;

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[PissingSpot Auth] Nelze uložit ${key} do localStorage (možná překročena kvóta prohlížeče):`, err);
  }
}

function sanitizeProfile(p: UserProfile): UserProfile {
  // Ochrana před obřími base64 daty v avataru, která by mohla překročit 5MB kvótu
  if (p.avatar && p.avatar.length > 50000) {
    return { ...p, avatar: '👑' };
  }
  return p;
}

// Vytvoření nového profilu od nuly (0 L, Level 1)
export function createZeroProfile(email: string, name?: string): UserProfile {
  const cleanEmail = email.trim().toLowerCase();
  const rawPrefix = cleanEmail.split('@')[0] || 'kropic';
  const displayName = name?.trim() || rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1);
  const handle = `@${rawPrefix.replace(/[^a-zA-Z0-9_]/g, '') || 'kropic'}`;

  const rank = getPissRank(0);

  return {
    username: displayName,
    handle,
    email: cleanEmail,
    avatar: '👑',
    rankTitle: rank.formattedRank,
    puddleFriendsCount: 0,
    puddleFriends: [],
    litersTotal: 0,
    timeTotalMinutes: 0,
    spotsCount: 0,
    highestAltitude: 0,
    lowestAltitude: 0,
    hydrationAvg: 3,
    privacyZoneRadiusMeters: 150,
    soundEnabled: true,
    anonymousMode: false,
    darkMode: false,
    calendarData: []
  };
}

// Načtení celého registru účtů
export function getAccountsRegistry(): AccountsRegistry {
  if (memoryRegistry) {
    return memoryRegistry;
  }

  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryRegistry = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Chyba při čtení pissing_accounts_registry:', err);
  }

  // Výchozí inicializace: vložíme dosavadní profil jako výchozí účet
  const defaultEmail = 'kapitan.prutok@gmail.com';
  let defaultProfile = initialProfile;
  try {
    const saved = localStorage.getItem('pissing_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      defaultProfile = sanitizeProfile({ ...initialProfile, ...parsed });
    }
  } catch {}

  let defaultVisited: string[] = ['spot-3', 'spot-6', 'spot-7', 'spot-8'];
  try {
    const savedVisited = localStorage.getItem('pissing_visited_spots');
    if (savedVisited) {
      defaultVisited = JSON.parse(savedVisited);
    }
  } catch {}

  const initialRegistry: AccountsRegistry = {
    [defaultEmail]: {
      profile: {
        ...defaultProfile,
        email: defaultEmail
      },
      userPissedSpotIds: defaultVisited
    }
  };

  memoryRegistry = initialRegistry;
  safeSetItem(REGISTRY_STORAGE_KEY, JSON.stringify(initialRegistry));
  try {
    if (!localStorage.getItem(ACTIVE_EMAIL_STORAGE_KEY)) {
      safeSetItem(ACTIVE_EMAIL_STORAGE_KEY, defaultEmail);
    }
  } catch {}

  return initialRegistry;
}

// Uložení jednoho účtu do registru
export function saveAccount(profile: UserProfile, userPissedSpotIds: string[]): void {
  const email = (profile.email || 'kapitan.prutok@gmail.com').trim().toLowerCase();
  const registry = getAccountsRegistry();
  const cleanProf = sanitizeProfile({ ...profile, email });

  registry[email] = {
    profile: cleanProf,
    userPissedSpotIds
  };
  memoryRegistry = registry;

  safeSetItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  safeSetItem(ACTIVE_EMAIL_STORAGE_KEY, email);
  safeSetItem('pissing_profile', JSON.stringify(cleanProf));
  safeSetItem('pissing_visited_spots', JSON.stringify(userPissedSpotIds));
}

// Získání aktivního účtu
export function getActiveAccount(): AccountData {
  const registry = getAccountsRegistry();
  let activeEmail = 'kapitan.prutok@gmail.com';
  try {
    activeEmail = (localStorage.getItem(ACTIVE_EMAIL_STORAGE_KEY) || 'kapitan.prutok@gmail.com').trim().toLowerCase();
  } catch {}

  if (registry[activeEmail]) {
    return registry[activeEmail];
  }

  // Pokud neexistuje, vytvoříme nový
  const newProf = createZeroProfile(activeEmail);
  const newAcc: AccountData = { profile: newProf, userPissedSpotIds: [] };
  registry[activeEmail] = newAcc;
  memoryRegistry = registry;
  safeSetItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  return newAcc;
}

// Přihlášení přes Google / Gmail
export function loginWithGoogle(email: string, name?: string): AccountData {
  const cleanEmail = email.trim().toLowerCase();
  const registry = getAccountsRegistry();

  if (registry[cleanEmail]) {
    // Existující účet – načteme jeho stávající stav
    safeSetItem(ACTIVE_EMAIL_STORAGE_KEY, cleanEmail);
    safeSetItem('pissing_profile', JSON.stringify(registry[cleanEmail].profile));
    safeSetItem('pissing_visited_spots', JSON.stringify(registry[cleanEmail].userPissedSpotIds));
    return registry[cleanEmail];
  }

  // Nový účet – začíná striktně na 0 L, Level 1
  const zeroProfile = createZeroProfile(cleanEmail, name);
  const newAccount: AccountData = {
    profile: zeroProfile,
    userPissedSpotIds: []
  };

  registry[cleanEmail] = newAccount;
  memoryRegistry = registry;
  safeSetItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  safeSetItem(ACTIVE_EMAIL_STORAGE_KEY, cleanEmail);
  safeSetItem('pissing_profile', JSON.stringify(zeroProfile));
  safeSetItem('pissing_visited_spots', JSON.stringify([]));

  return newAccount;
}

// Odhlášení / přepnutí
export function switchAccount(email: string): AccountData {
  return loginWithGoogle(email);
}
