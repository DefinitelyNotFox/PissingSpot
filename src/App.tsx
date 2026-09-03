import { useState, useEffect } from 'react';
import { BottomNav, type TabType } from './components/BottomNav';
import { MapScreen } from './screens/MapScreen';
import { FeedScreen } from './screens/FeedScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PissModal } from './components/PissModal';
import { PissSplashAnimation } from './components/PissSplashAnimation';
import { DrippingDrops } from './components/DrippingDrops';
import type { Spot, ScopeType, UserProfile, SpotComment } from './types/spot';
import { 
  initialSpots, 
  initialFeed, 
  initialAchievements, 
  initialLeaderboards 
} from './data/initialData';
import { soundFx } from './utils/audio';
import { getPissRank } from './utils/rank';
import { getActiveAccount, saveAccount, loginWithGoogle } from './utils/auth';
import { 
  signInWithGoogle, 
  signOutUser, 
  subscribeToAuth, 
  saveUserProfileToCloud 
} from './services/authService';
import { 
  subscribeToSpots, 
  addSpotToCloud, 
  checkInSpotInCloud, 
  addCommentToCloud 
} from './services/spotService';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [scope, setScope] = useState<ScopeType>('world');
  const [isPissModalOpen, setIsPissModalOpen] = useState(false);

  // Persistent / Local State
  const [spots, setSpots] = useState<Spot[]>(() => {
    const saved = localStorage.getItem('pissing_spots');
    return saved ? JSON.parse(saved) : initialSpots;
  });

  const [feed, setFeed] = useState(() => {
    const saved = localStorage.getItem('pissing_feed');
    return saved ? JSON.parse(saved) : initialFeed;
  });

  const [accountData, setAccountData] = useState(() => getActiveAccount());
  const [profile, setProfile] = useState<UserProfile>(() => accountData.profile);
  const [userPissedSpotIds, setUserPissedSpotIds] = useState<string[]>(() => accountData.userPissedSpotIds);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  const [leaderboards, setLeaderboards] = useState(() => {
    const saved = localStorage.getItem('pissing_leaderboards');
    return saved ? JSON.parse(saved) : initialLeaderboards;
  });

  const [achievements] = useState(() => initialAchievements);

  // User Coordinates (Default Prague Center, updated with real GPS if permitted)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 50.0875,
    lng: 14.4214
  });

  // Seamless Golden Drops Animation State
  const [splashAnimation, setSplashAnimation] = useState<{
    show: boolean;
    title: string;
    subtitle?: string;
  }>({ show: false, title: '' });

  // 1. Real-time Cloud Firestore listener pro všechny spoty
  useEffect(() => {
    const unsubscribeSpots = subscribeToSpots((cloudSpots) => {
      if (cloudSpots && cloudSpots.length > 0) {
        setSpots(cloudSpots);
      }
    });
    return () => unsubscribeSpots();
  }, []);

  // 2. Real-time Firebase Authentication listener
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((userData) => {
      if (userData) {
        setFirebaseUid(userData.uid);
        setProfile(userData.profile);
        setUserPissedSpotIds(userData.userPissedSpotIds);
      } else {
        setFirebaseUid(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync to localStorage and Cloud Firestore
  useEffect(() => {
    localStorage.setItem('pissing_spots', JSON.stringify(spots));
  }, [spots]);

  useEffect(() => {
    saveAccount(profile, userPissedSpotIds);
    if (firebaseUid) {
      saveUserProfileToCloud(firebaseUid, profile, userPissedSpotIds);
    }
    soundFx.setEnabled(profile.soundEnabled);
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile, userPissedSpotIds, firebaseUid]);

  const handleGoogleSignIn = async () => {
    try {
      const userData = await signInWithGoogle();
      setFirebaseUid(userData.uid);
      setProfile(userData.profile);
      setUserPissedSpotIds(userData.userPissedSpotIds);
    } catch (err) {
      console.error('Chyba při přihlášení přes Google:', err);
      throw err;
    }
  };

  const handleSwitchAccount = (email: string, name?: string) => {
    const nextAcc = loginWithGoogle(email, name);
    setAccountData(nextAcc);
    setProfile(nextAcc.profile);
    setUserPissedSpotIds(nextAcc.userPissedSpotIds);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch {}
    const nextAcc = loginWithGoogle('kapitan.prutok@gmail.com');
    setAccountData(nextAcc);
    setProfile(nextAcc.profile);
    setUserPissedSpotIds(nextAcc.userPissedSpotIds);
    setFirebaseUid(null);
  };

  // Request GPS Poloha
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Fallback to Prague
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Preload pee sound MP3 for instant playback
  useEffect(() => {
    soundFx.preload();
  }, []);

  // Add Spot handler from PissModal
  const handleAddSpot = (newSpot: Spot) => {
    setSpots((prev) => [newSpot, ...prev]);

    // Uložit do Cloud Firestore pro všechny uživatele
    addSpotToCloud(newSpot).catch((err) => {
      console.warn('Nepodařilo se uložit spot do Firestore:', err);
    });

    const oldRank = getPissRank(profile.litersTotal).rank;
    const newLiters = profile.litersTotal + 1;
    const newRankInfo = getPissRank(newLiters);
    const leveledUp = newRankInfo.rank > oldRank;

    // Update profile stats
    setProfile((prev) => {
      const updatedCalendar = [...prev.calendarData];
      if (updatedCalendar.length > 0) {
        updatedCalendar[updatedCalendar.length - 1].count += 1;
      }
      return {
        ...prev,
        litersTotal: newLiters,
        rankTitle: newRankInfo.formattedRank,
        spotsCount: prev.spotsCount + 1,
        calendarData: updatedCalendar
      };
    });

    // Update leaderboard
    setLeaderboards((prev: typeof initialLeaderboards) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[k] = updated[k].map((u) => {
          if (u.isCurrentUser) {
            return {
              ...u,
              liters: u.liters + 1,
              spotsCount: u.spotsCount + 1
            };
          }
          return u;
        });
      });
      return updated;
    });

    // Mark as user pissed spot & trigger splash animation
    setUserPissedSpotIds((prev) => (prev.includes(newSpot.id) ? prev : [newSpot.id, ...prev]));
    soundFx.playFlush();
    setSplashAnimation({
      show: true,
      title: leveledUp ? '🎉 LEVEL UP!' : 'REVÍR OZNAČEN! 💦',
      subtitle: leveledUp
        ? `${newRankInfo.formattedRank} dosažen! (+1 L)`
        : `${newSpot.title} • +1 L do levelu`
    });

    // Also add an entry to Feed
    const newFeedPost = {
      id: `feed-${Date.now()}`,
      spotId: newSpot.id,
      author: profile.username,
      authorHandle: profile.handle,
      authorAvatar: profile.avatar,
      timeAgo: 'Právě teď',
      spotTitle: newSpot.title,
      spotCategory: newSpot.category,
      rating: Math.round(newSpot.rating),
      epiphany: newSpot.epiphany || 'Nový revír úspěšně označen!',
      distance: 'Zde',
      isLive: true,
      reactions: { paper: 0, skunk: 0, target: 1, respect: 1 }
    };
    setFeed((prev: typeof initialFeed) => [newFeedPost, ...prev]);
  };

  // Quick Check-in handler
  const handleQuickCheckIn = (spot: Spot) => {
    soundFx.playFlush();
    setSpots((prev) =>
      prev.map((s) => (s.id === spot.id ? { ...s, reviewsCount: s.reviewsCount + 1 } : s))
    );

    // Zapsat check-in do Cloud Firestore
    checkInSpotInCloud(spot.id).catch(() => {});

    const oldRank = getPissRank(profile.litersTotal).rank;
    const newLiters = profile.litersTotal + 1;
    const newRankInfo = getPissRank(newLiters);
    const leveledUp = newRankInfo.rank > oldRank;

    setProfile((prev) => ({
      ...prev,
      litersTotal: newLiters,
      rankTitle: newRankInfo.formattedRank
    }));

    // Mark as user pissed spot & trigger seamless celebratory splash
    setUserPissedSpotIds((prev) => (prev.includes(spot.id) ? prev : [spot.id, ...prev]));
    setSplashAnimation({
      show: true,
      title: leveledUp ? '🎉 LEVEL UP!' : 'REVÍR ZALIT! 💦',
      subtitle: leveledUp
        ? `${newRankInfo.formattedRank} dosažen! (+1 L)`
        : `${spot.title} • +1 L do levelu`
    });

    // Also add live check-in to shared feed
    const checkInFeedPost = {
      id: `feed-${Date.now()}`,
      spotId: spot.id,
      author: profile.username,
      authorHandle: profile.handle,
      authorAvatar: profile.avatar,
      timeAgo: 'Právě teď',
      spotTitle: spot.title,
      spotCategory: spot.category,
      rating: Math.round(spot.rating),
      epiphany: `${profile.username} právě zalil tento revír! 💦`,
      distance: 'Zde',
      isLive: true,
      reactions: { paper: 0, skunk: 0, target: 1, respect: 1 }
    };
    setFeed((prev: typeof initialFeed) => [checkInFeedPost, ...prev]);
  };

  const handleSelectSpotOnMap = () => {
    setActiveTab('map');
  };

  const handleTogglePuddleFriend = (authorData: {
    username: string;
    handle: string;
    avatar: string;
  }) => {
    soundFx.playDroplet();
    setProfile((prev) => {
      const friends = prev.puddleFriends || [];
      const existingIndex = friends.findIndex(
        (f) =>
          f.handle.toLowerCase() === authorData.handle.toLowerCase() ||
          f.username.toLowerCase() === authorData.username.toLowerCase()
      );

      let updatedFriends: typeof friends;
      if (existingIndex >= 0) {
        updatedFriends = friends.map((f, i) =>
          i === existingIndex ? { ...f, isFriend: !f.isFriend } : f
        );
      } else {
        const newFriend = {
          id: `friend-${Date.now()}`,
          username: authorData.username,
          handle: authorData.handle,
          avatar: authorData.avatar || '👤',
          title: 'Parťák v revíru',
          distance: 'V okolí',
          spotsCount: 1,
          isFriend: true
        };
        updatedFriends = [newFriend, ...friends];
      }

      const count = updatedFriends.filter((f) => f.isFriend).length;
      return {
        ...prev,
        puddleFriends: updatedFriends,
        puddleFriendsCount: count
      };
    });
  };

  const handleAddComment = (spotId: string, comment: SpotComment) => {
    const targetSpot = spots.find((s) => s.id === spotId);
    if (targetSpot) {
      addCommentToCloud(
        spotId,
        comment,
        targetSpot.comments || [],
        targetSpot.rating,
        targetSpot.reviewsCount
      ).catch(() => {});
    }

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id !== spotId) return s;
        const currentComments = s.comments || [];
        const newComments = [comment, ...currentComments];
        const newRating = Number(
          ((s.rating * s.reviewsCount + comment.rating) / (s.reviewsCount + 1)).toFixed(1)
        );
        return {
          ...s,
          reviewsCount: s.reviewsCount + 1,
          rating: newRating,
          comments: newComments
        };
      })
    );
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[var(--bg-gradient)] text-[var(--text-main)] antialiased font-sans">
      
      {/* Dynamic Screen View */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {/* Ambient dripping drops animation – visible only outside map */}
        {activeTab !== 'map' && <DrippingDrops />}
        {activeTab === 'map' && (
          <MapScreen
            spots={spots}
            scope={scope}
            onScopeChange={setScope}
            onOpenPissModal={() => setIsPissModalOpen(true)}
            onQuickCheckIn={handleQuickCheckIn}
            userCoords={userCoords}
            puddleFriends={profile.puddleFriends}
            onTogglePuddleFriend={handleTogglePuddleFriend}
            userPissedSpotIds={userPissedSpotIds}
            onAddComment={handleAddComment}
            currentUser={{ username: profile.username, avatar: profile.avatar, handle: profile.handle }}
          />
        )}

        {activeTab === 'feed' && (
          <FeedScreen
            posts={feed}
            onSelectSpotOnMap={handleSelectSpotOnMap}
            puddleFriends={profile.puddleFriends}
            onTogglePuddleFriend={handleTogglePuddleFriend}
            spots={spots}
            onAddComment={handleAddComment}
            currentUser={{ username: profile.username, avatar: profile.avatar, handle: profile.handle }}
          />
        )}

        {activeTab === 'ranks' && (
          <LeaderboardScreen
            leaderboards={leaderboards}
            achievements={achievements}
            puddleFriends={profile.puddleFriends}
            currentProfile={profile}
            userPissedSpotIds={userPissedSpotIds}
            spots={spots}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            profile={profile}
            onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
            onSwitchAccount={handleSwitchAccount}
            onGoogleSignIn={handleGoogleSignIn}
            onLogout={handleLogout}
            spots={spots}
            userPissedSpotIds={userPissedSpotIds}
          />
        )}
        {/* Fullscreen Piss Modal (uvnitř main, takže spodní lišta zůstává vždy viditelná) */}
        <PissModal
          isOpen={isPissModalOpen}
          onClose={() => setIsPissModalOpen(false)}
          onAddSpot={handleAddSpot}
          userCoords={userCoords}
          currentUser={profile}
        />
      </main>

      {/* Spodní lišta se 4 ikonami bez textu */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(t) => {
          soundFx.playDroplet();
          setActiveTab(t);
        }}
        hasUnreadFeed={true}
      />

      {/* Rychlá seamless easy in / out animace žlutých kapek při zapsání pissu */}
      <PissSplashAnimation
        show={splashAnimation.show}
        title={splashAnimation.title}
        subtitle={splashAnimation.subtitle}
        onComplete={() => setSplashAnimation((prev) => ({ ...prev, show: false }))}
      />

    </div>
  );
}

export default App;
