import type { Achievement, UserProfile, Spot } from '../types/spot';

export function evaluateAchievements(
  baseAchievements: Achievement[],
  profile?: UserProfile,
  pissedSpotIds: string[] = [],
  spots: Spot[] = []
): Achievement[] {
  if (!profile) {
    return baseAchievements.map((a) => ({ ...a, unlocked: false, progress: 0 }));
  }

  const userSpotsCount = profile.spotsCount || 0;
  const userLiters = profile.litersTotal || 0;
  const friendsCount = (profile.puddleFriends || []).filter((f) => f.isFriend).length;

  // Spoty zalité tímto uživatelem nebo jím vytvořené
  const pissedSpots = spots.filter(
    (s) =>
      (profile.handle && s.authorHandle && s.authorHandle.toLowerCase() === profile.handle.toLowerCase()) ||
      pissedSpotIds.includes(s.id)
  );

  const countries = new Set<string>();
  let hasOver1000m = false;
  let hasZeroSplash = false;
  let hasPub = false;
  let hasNature = false;
  let mossCount = 0;

  pissedSpots.forEach((s) => {
    if (s.lat && s.lng) {
      if (s.lat >= 48.5 && s.lat <= 51.1 && s.lng >= 12.0 && s.lng <= 18.9) {
        countries.add('CZ');
      } else {
        countries.add('WORLD');
      }
    }
    if (s.altitude && s.altitude >= 1000) hasOver1000m = true;
    if (s.metrics?.splashback === 0) hasZeroSplash = true;
    if (s.category === 'pub') hasPub = true;
    if (s.category === 'view') {
      hasNature = true;
    }
    if (s.ground === 'mech') mossCount++;
  });

  return baseAchievements.map((ach) => {
    const maxProg = ach.maxProgress ?? 1;
    let progress = 0;

    switch (ach.id) {
      // 1. Divočina
      case 'ach-nat-1':
        progress = (hasNature || userSpotsCount > 0) ? 1 : 0;
        break;
      case 'ach-nat-2':
        progress = Math.min(maxProg, mossCount);
        break;
      case 'ach-nat-3':
        progress = (hasOver1000m || (profile.highestAltitude && profile.highestAltitude >= 1000)) ? 1 : 0;
        break;
      case 'ach-nat-4':
        progress = 0;
        break;

      // 2. Noční kropič
      case 'ach-night-1':
        progress = hasPub ? 1 : 0;
        break;
      case 'ach-night-2':
        progress = Math.min(maxProg, Math.floor(userSpotsCount / 2));
        break;
      case 'ach-night-3':
        progress = pissedSpots.some((s) => s.category === 'toitoi') ? 1 : 0;
        break;
      case 'ach-night-4':
        progress = userLiters >= 10 ? 1 : 0;
        break;

      // 3. Balistika
      case 'ach-ball-1':
        progress = hasZeroSplash ? 1 : 0;
        break;
      case 'ach-ball-2':
        progress = Math.min(maxProg, Math.floor(userSpotsCount / 3));
        break;
      case 'ach-ball-3':
        progress = userSpotsCount >= 3 ? 1 : 0;
        break;
      case 'ach-ball-4':
        progress = userSpotsCount >= 5 ? 1 : 0;
        break;

      // 4. Světoběžník
      case 'ach-world-1':
        progress = countries.has('CZ') ? 1 : 0;
        break;
      case 'ach-world-2':
        progress = countries.has('WORLD') ? 1 : 0;
        break;
      case 'ach-world-3':
        progress = Math.min(maxProg, countries.size);
        break;
      case 'ach-world-4':
        progress = 0;
        break;

      // 5. Bratrstvo
      case 'ach-soc-1':
        progress = Math.min(1, friendsCount);
        break;
      case 'ach-soc-2':
        progress = Math.min(4, friendsCount);
        break;
      case 'ach-soc-3':
        progress = userSpotsCount >= 2 ? 1 : 0;
        break;
      case 'ach-soc-4':
        progress = userLiters >= 50 ? 1 : 0;
        break;

      default:
        progress = 0;
    }

    const unlocked = progress >= maxProg && progress > 0;

    return {
      ...ach,
      progress,
      unlocked,
      unlockedAt: unlocked ? (ach.unlockedAt || 'Odemčeno') : undefined
    };
  });
}
