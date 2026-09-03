import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import type { UserProfile } from '../types/spot';
import { getPissRank } from '../utils/rank';

export interface CloudUserData {
  uid: string;
  profile: UserProfile;
  userPissedSpotIds: string[];
}

export function createZeroGoogleProfile(firebaseUser: FirebaseUser): UserProfile {
  const email = firebaseUser.email?.trim().toLowerCase() || '';
  const prefix = email.split('@')[0] || 'kropic';
  const displayName = firebaseUser.displayName || (prefix.charAt(0).toUpperCase() + prefix.slice(1));
  const handle = `@${prefix.replace(/[^a-zA-Z0-9_]/g, '') || 'kropic'}`;

  const rank = getPissRank(0);

  return {
    username: displayName,
    handle,
    email,
    avatar: firebaseUser.photoURL || '👑',
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

// Přihlášení přes reálné Google vyskakovací okno
export async function signInWithGoogle(): Promise<CloudUserData> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;

  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      uid: user.uid,
      profile: data.profile,
      userPissedSpotIds: data.userPissedSpotIds || []
    };
  }

  // Nový účet – čistý start od 0 L a Levelu 1
  const zeroProfile = createZeroGoogleProfile(user);
  const initialData: CloudUserData = {
    uid: user.uid,
    profile: zeroProfile,
    userPissedSpotIds: []
  };

  await setDoc(userDocRef, {
    profile: zeroProfile,
    userPissedSpotIds: []
  });

  return initialData;
}

// Odhlášení
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Real-time odběr stavu přihlášení
export function subscribeToAuth(
  callback: (userData: CloudUserData | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          uid: firebaseUser.uid,
          profile: data.profile,
          userPissedSpotIds: data.userPissedSpotIds || []
        });
      } else {
        const zeroProf = createZeroGoogleProfile(firebaseUser);
        await setDoc(userDocRef, {
          profile: zeroProf,
          userPissedSpotIds: []
        });
        callback({
          uid: firebaseUser.uid,
          profile: zeroProf,
          userPissedSpotIds: []
        });
      }
    } catch (err) {
      console.error('Chyba při načítání uživatele z Firestore:', err);
      // Fallback s lokálním profilem
      const zeroProf = createZeroGoogleProfile(firebaseUser);
      callback({
        uid: firebaseUser.uid,
        profile: zeroProf,
        userPissedSpotIds: []
      });
    }
  });
}

// Uložení aktualizovaného profilu do Firestore
export async function saveUserProfileToCloud(
  uid: string, 
  profile: UserProfile, 
  userPissedSpotIds: string[]
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      profile,
      userPissedSpotIds,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Chyba při ukládání profilu do Firestore:', err);
  }
}
