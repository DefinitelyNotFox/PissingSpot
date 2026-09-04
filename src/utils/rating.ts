import type { Spot } from '../types/spot';

/**
 * Získá všechna hodnocení daného spotu (první hodnocení autora + všechna hodnocení z komentářů / recenzí).
 */
export function getSpotRatings(spot: Spot): number[] {
  if (spot.ratings && spot.ratings.length > 0) {
    return spot.ratings;
  }
  const initial = spot.initialRating ?? spot.rating ?? 5.0;
  const list = [initial];
  if (spot.comments && spot.comments.length > 0) {
    spot.comments.forEach((c) => {
      if (typeof c.rating === 'number' && c.rating > 0) {
        list.push(c.rating);
      }
    });
  }
  return list;
}

/**
 * Spočítá aritmetický průměr všech hodnocení zaokrouhlený na 1 desetinné místo.
 */
export function calcAverageRating(ratings: number[]): number {
  if (!ratings || ratings.length === 0) return 5.0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return Number((sum / ratings.length).toFixed(1));
}
