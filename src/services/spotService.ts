import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  increment 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Spot, SpotComment } from '../types/spot';
import { initialSpots } from '../data/initialData';

const SPOTS_COLLECTION = 'spots';

// Real-time posluchač všech spotů na mapě
export function subscribeToSpots(
  callback: (spots: Spot[]) => void
): () => void {
  const spotsRef = collection(db, SPOTS_COLLECTION);

  return onSnapshot(
    spotsRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Pokud je databáze prázdná, vrátíme počáteční spoty a nahrajeme je do cloudu pro všechny
        callback(initialSpots);
        initialSpots.forEach((s) => {
          setDoc(doc(db, SPOTS_COLLECTION, s.id), s).catch(() => {});
        });
        return;
      }

      const spots: Spot[] = [];
      snapshot.forEach((docSnap) => {
        spots.push(docSnap.data() as Spot);
      });

      callback(spots);
    },
    (error) => {
      console.warn('Firestore real-time subscription error, using local/cached fallback:', error);
      callback(initialSpots);
    }
  );
}

// Uložení nového spotu do Firestore (pro všechny uživatele na světě)
export async function addSpotToCloud(spot: Spot): Promise<void> {
  try {
    const spotRef = doc(db, SPOTS_COLLECTION, spot.id);
    await setDoc(spotRef, spot);
  } catch (error) {
    console.error('Chyba při ukládání spotu do Firestore:', error);
    throw error;
  }
}

// Provedení zářezu (check-in) u spotu v cloudu
export async function checkInSpotInCloud(spotId: string): Promise<void> {
  try {
    const spotRef = doc(db, SPOTS_COLLECTION, spotId);
    await updateDoc(spotRef, {
      reviewsCount: increment(1)
    });
  } catch (error) {
    console.error('Chyba při check-inu spotu ve Firestore:', error);
  }
}

// Přidání komentáře ke spotu v cloudu
export async function addCommentToCloud(
  spotId: string, 
  newComment: SpotComment, 
  currentComments: SpotComment[],
  currentRating: number,
  reviewsCount: number
): Promise<void> {
  try {
    const spotRef = doc(db, SPOTS_COLLECTION, spotId);
    const updatedComments = [newComment, ...currentComments];
    const newRating = Number(
      ((currentRating * reviewsCount + newComment.rating) / (reviewsCount + 1)).toFixed(1)
    );

    await updateDoc(spotRef, {
      comments: updatedComments,
      reviewsCount: reviewsCount + 1,
      rating: newRating
    });
  } catch (error) {
    console.error('Chyba při ukládání komentáře do Firestore:', error);
  }
}
