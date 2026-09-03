import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Spot, ScopeType, PuddleFriend, SpotComment } from '../types/spot';
import { SpotDetailCard } from '../components/SpotDetailCard';
import { NearbySpotsModal } from '../components/NearbySpotsModal';
import { User, Users, Globe, Zap, Search } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface MapScreenProps {
  spots: Spot[];
  scope: ScopeType;
  onScopeChange: (scope: ScopeType) => void;
  onOpenPissModal: () => void;
  onQuickCheckIn: (spot: Spot) => void;
  userCoords: { lat: number; lng: number };
  puddleFriends?: PuddleFriend[];
  onTogglePuddleFriend?: (authorData: { username: string; handle: string; avatar: string }) => void;
  userPissedSpotIds?: string[];
  onAddComment?: (spotId: string, comment: SpotComment) => void;
  currentUser?: {
    username: string;
    avatar: string;
  };
}

const DRIP_DROPS = [
  { id: 1, left: '16%', delay: '0s', duration: '1.9s' },
  { id: 2, left: '33%', delay: '1.1s', duration: '2.3s' },
  { id: 3, left: '50%', delay: '0.4s', duration: '1.7s' },
  { id: 4, left: '67%', delay: '1.4s', duration: '2.1s' },
  { id: 5, left: '84%', delay: '0.7s', duration: '1.8s' }
];

const CATEGORY_EMOJI: Record<Spot['category'], string> = {
  view: '⛰️',
  toilet: '🚻',
  kadibudka: '🛖',
  toitoi: '🚽',
  nature: '🌲',
  pub: '🍺',
  emergency: '⚠️',
  other: '✨'
};

export const MapScreen: React.FC<MapScreenProps> = ({
  spots,
  scope,
  onScopeChange,
  onOpenPissModal,
  onQuickCheckIn,
  userCoords,
  puddleFriends,
  onTogglePuddleFriend,
  userPissedSpotIds = [],
  onAddComment,
  currentUser
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Filter spots based on scope
  const filteredSpots = spots.filter((s) => {
    if (scope === 'me') return s.authorScope === 'me';
    if (scope === 'friends') return s.authorScope === 'me' || s.authorScope === 'friends';
    return true; // 'world'
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // 100% Free OpenStreetMap standard tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer group for spot markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // User GPS location pulsing marker
    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; background: rgba(234, 179, 8, 0.4); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 13px; height: 13px; background: #eab308; border: 2.5px solid #000000; border-radius: 9999px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
      .bindTooltip('Tvá aktuální poloha', { direction: 'top', className: 'text-xs font-black border border-black rounded-lg shadow' })
      .addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [userCoords.lat, userCoords.lng]);

  // Update Markers when spots or scope change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredSpots.forEach((spot) => {
      const emoji = CATEGORY_EMOJI[spot.category] || '⚡';
      const isSelected = selectedSpot?.id === spot.id;
      const hasPissedHere = spot.authorScope === 'me' || userPissedSpotIds.includes(spot.id);

      // Yellow urine drop SVG inlined
      const urineDropSvg = `
        <svg viewBox="0 0 24 24" width="10" height="10" style="display:inline-block; vertical-align:middle; margin-left:2px;">
          <path d="M12 2.5 C12 2.5 4.5 12 4.5 16.5 A7.5 7.5 0 0 0 19.5 16.5 C19.5 12 12 2.5 12 2.5 Z" fill="#facc15" stroke="#000000" stroke-width="1.5" />
        </svg>
      `;

      // Visited spot is bright yellow (#facc15), unvisited is clean white (#ffffff)
      const pinBg = hasPissedHere ? '#facc15' : '#ffffff';
      const pinBorder = hasPissedHere ? '2.5px solid #000000' : '2px solid #000000';
      const pinScale = isSelected ? '1.15' : hasPissedHere ? '1.05' : '1';

      const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
          <div style="
            position: relative;
            width: ${isSelected ? '44px' : '38px'};
            height: ${isSelected ? '44px' : '38px'};
            background: ${pinBg};
            color: #000000;
            border: ${pinBorder};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '20px' : '17px'};
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
            transform: scale(${pinScale});
          ">
            ${emoji}
            ${hasPissedHere ? '<span style="position: absolute; top: -3px; right: -3px; font-size: 10px; line-height: 1;" title="Zde jsi už zalil revír">⚡</span>' : ''}
          </div>
          <div style="
            background: #000000;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 1px 7px;
            border-radius: 9999px;
            border: 1px solid #000000;
            margin-top: 2px;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
          ">
            <span>${spot.rating.toFixed(1)}</span>
            ${urineDropSvg}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-spot-marker',
        html: markerHtml,
        iconSize: [44, 48],
        iconAnchor: [22, 24]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

      marker.on('click', () => {
        soundFx.playDroplet();
        setSelectedSpot(spot);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([spot.lat, spot.lng], { animate: true, duration: 0.4 });
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredSpots, selectedSpot]);

  const handleSelectSpotFromSearch = (spot: Spot) => {
    setSelectedSpot(spot);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([spot.lat, spot.lng], 16, { animate: true, duration: 0.5 });
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[var(--bg-app)]">
      
      {/* 1. Leaflet Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Top Floating Navigation: Scope Buttons + Search Magnifier */}
      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-white dark:bg-[#111827] border border-black dark:border-slate-800 p-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-black dark:text-white">
          
          {/* 1. Only Me */}
          <button
            onClick={() => {
              soundFx.playDroplet();
              onScopeChange('me');
            }}
            title="Pouze mé spoty"
            aria-label="Pouze mé spoty"
            className={`p-2.5 rounded-full transition-all ${
              scope === 'me'
                ? 'bg-[#facc15] text-black border border-black shadow-sm font-black'
                : 'text-slate-700 hover:text-black dark:text-slate-400'
            }`}
          >
            <User className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* 2. Friends & Squad */}
          <button
            onClick={() => {
              soundFx.playDroplet();
              onScopeChange('friends');
            }}
            title="Kamarádi v louži"
            aria-label="Kamarádi v louži"
            className={`p-2.5 rounded-full transition-all ${
              scope === 'friends'
                ? 'bg-[#facc15] text-black border border-black shadow-sm font-black'
                : 'text-slate-700 hover:text-black dark:text-slate-400'
            }`}
          >
            <Users className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* 3. Entire World */}
          <button
            onClick={() => {
              soundFx.playDroplet();
              onScopeChange('world');
            }}
            title="Celý svět"
            aria-label="Celý svět"
            className={`p-2.5 rounded-full transition-all ${
              scope === 'world'
                ? 'bg-[#facc15] text-black border border-black shadow-sm font-black'
                : 'text-slate-700 hover:text-black dark:text-slate-400'
            }`}
          >
            <Globe className="w-5 h-5 stroke-[2.4]" />
          </button>

          {/* Divider */}
          <div className="w-[1px] h-5 bg-black/20 dark:bg-white/20 mx-0.5" />

          {/* 4. Search Magnifier Button */}
          <button
            onClick={() => {
              soundFx.playDroplet();
              setIsSearchOpen(true);
            }}
            title="Hledat top spoty v okolí"
            aria-label="Hledat top spoty v okolí"
            className="p-2.5 rounded-full transition-all text-slate-700 hover:text-black dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search className="w-5 h-5 stroke-[2.4]" />
          </button>

        </div>
      </div>

      {/* 3. Spot Detail Card */}
      {selectedSpot && (
        <SpotDetailCard
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onQuickPiss={(s) => onQuickCheckIn(s)}
          puddleFriends={puddleFriends}
          onTogglePuddleFriend={onTogglePuddleFriend}
          userPissedSpotIds={userPissedSpotIds}
          currentUser={currentUser}
          onAddComment={(spotId, comment) => {
            onAddComment?.(spotId, comment);
            setSelectedSpot((prev) => {
              if (!prev || prev.id !== spotId) return prev;
              const newComments = [comment, ...(prev.comments || [])];
              const newRating = Number(
                ((prev.rating * prev.reviewsCount + comment.rating) / (prev.reviewsCount + 1)).toFixed(1)
              );
              return {
                ...prev,
                reviewsCount: prev.reviewsCount + 1,
                rating: newRating,
                comments: newComments
              };
            });
          }}
        />
      )}

      {/* 4. Nearby Spots Search Modal */}
      <NearbySpotsModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        spots={spots}
        userCoords={userCoords}
        onSelectSpot={handleSelectSpotFromSearch}
        onSelectAnchorOnMap={(anchorCoords) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([anchorCoords.lat, anchorCoords.lng], 13, { animate: true, duration: 0.6 });
          }
        }}
      />

      {/* 5. THE BIG PISSNOUT ACTION BUTTON WITH ANIMATED YELLOW BORDER & DRIPPING DROPS */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="relative pointer-events-auto">
          <button
            onClick={() => {
              soundFx.playDroplet();
              onOpenPissModal();
            }}
            className="relative z-10 px-8 py-3.5 bg-[#facc15] hover:bg-yellow-400 text-black font-black text-sm tracking-wider rounded-full border-2 border-black flex items-center gap-3 transform transition hover:scale-105 active:scale-95 animate-piss-border shadow-2xl"
          >
            <Zap className="w-5 h-5 fill-current text-black flex-shrink-0" />
            <span>PISSNOUT</span>
            <Zap className="w-5 h-5 fill-current text-black flex-shrink-0" />
          </button>

          {/* Dripping yellow urine drops hanging from bottom edge */}
          <div className="absolute -bottom-1 left-0 right-0 h-10 pointer-events-none overflow-visible">
            {DRIP_DROPS.map((drop) => (
              <div
                key={drop.id}
                className="absolute"
                style={{ left: drop.left }}
              >
                {/* Wet rim bead */}
                <div className="w-2 h-1 bg-yellow-400 rounded-b-full border-b border-x border-black -translate-x-1/2" />
                
                {/* Falling drop */}
                <div
                  className="absolute top-0 -translate-x-1/2 animate-piss-drip"
                  style={{
                    animationDuration: drop.duration,
                    animationDelay: drop.delay
                  }}
                >
                  <svg width="8" height="12" viewBox="0 0 10 14" fill="none">
                    <path
                      d="M5 0 C5 0 0 6 0 9.5 C0 12 2.2 14 5 14 C7.8 14 10 12 10 9.5 C10 6 5 0 5 0 Z"
                      fill="#facc15"
                      stroke="#000000"
                      strokeWidth="1.2"
                    />
                    <ellipse cx="3.5" cy="9.5" rx="1.2" ry="2" fill="#ffffff" opacity="0.8" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
