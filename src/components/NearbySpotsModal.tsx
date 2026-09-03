import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Spot } from '../types/spot';
import { X, Search, MapPin, SlidersHorizontal, Flame, Navigation, Loader2, Compass } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { UrineRating, UrineDrop } from './UrineDrop';

interface LocationAnchor {
  name: string;
  lat: number;
  lng: number;
  isGps?: boolean;
}

interface NearbySpotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: Spot[];
  userCoords: { lat: number; lng: number };
  onSelectSpot: (spot: Spot) => void;
  onSelectAnchorOnMap?: (coords: { lat: number; lng: number; name: string }) => void;
}

type SortByType = 'distance' | 'rating' | 'reviews';

const RADIUS_PRESETS = [3, 5, 10, 25, 50];

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

// Popular curated places and cities in Czechia for instantaneous lookup
const QUICK_LOCATIONS: LocationAnchor[] = [
  { name: 'Praha (Centrum)', lat: 50.0875, lng: 14.4214 },
  { name: 'Brno (Náměstí Svobody)', lat: 49.1951, lng: 16.6068 },
  { name: 'Ostrava (Střed)', lat: 49.8346, lng: 18.2820 },
  { name: 'Plzeň (Centrum)', lat: 49.7475, lng: 13.3776 },
  { name: 'Liberec (Ještěd / Střed)', lat: 50.7671, lng: 15.0562 },
  { name: 'Olomouc (Horní náměstí)', lat: 49.5938, lng: 17.2509 },
  { name: 'České Budějovice', lat: 48.9745, lng: 14.4743 },
  { name: 'Hradec Králové', lat: 50.2092, lng: 15.8328 },
  { name: 'Špindlerův Mlýn (Krkonoše)', lat: 50.7258, lng: 15.6097 },
  { name: 'Český Krumlov', lat: 48.8109, lng: 14.3152 },
  { name: 'Vyhlídka Máj (Slapy / Vltava)', lat: 49.8311, lng: 14.4561 },
  { name: 'Karlštejn (Hrad)', lat: 49.9395, lng: 14.1882 },
  { name: 'Karlovy Vary (Vřídlo)', lat: 50.2231, lng: 12.8837 },
  { name: 'Mikulov (Pálava)', lat: 48.8076, lng: 16.6378 },
  { name: 'Sněžka (Vrchol)', lat: 50.7360, lng: 15.7396 },
  { name: 'Pardubice', lat: 50.0343, lng: 15.7812 },
  { name: 'Zlín', lat: 49.2266, lng: 17.6683 },
  { name: 'Ústí nad Labem', lat: 50.6607, lng: 14.0328 }
];

// Haversine formula to calculate accurate distance in km
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export const NearbySpotsModal: React.FC<NearbySpotsModalProps> = ({
  isOpen,
  onClose,
  spots,
  userCoords,
  onSelectSpot,
  onSelectAnchorOnMap
}) => {
  if (!isOpen) return null;

  // Selected Location Anchor: Defaults to user's current GPS location
  const [anchor, setAnchor] = useState<LocationAnchor>({
    name: 'Tvá aktuální poloha',
    lat: userCoords.lat,
    lng: userCoords.lng,
    isGps: true
  });

  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [sortBy, setSortBy] = useState<SortByType>('distance');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [geocodedSuggestions, setGeocodedSuggestions] = useState<LocationAnchor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Live geocoding for typed cities/places using OpenStreetMap Nominatim
  useEffect(() => {
    if (!locationSearch.trim() || locationSearch.trim().length < 2) {
      setGeocodedSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsSearchingLocation(true);
    debounceTimeoutRef.current = window.setTimeout(async () => {
      try {
        const query = locationSearch.trim();
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=cz,sk&limit=5&addressdetails=1`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          const results: LocationAnchor[] = data.map((item: { display_name: string; lat: string; lon: string; name?: string }) => {
            const parts = item.display_name.split(',');
            const shortName = parts.slice(0, 2).join(', ').trim();
            return {
              name: shortName || item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              isGps: false
            };
          });
          setGeocodedSuggestions(results);
        }
      } catch {
        // Fallback to local curated list on network failure
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [locationSearch]);

  // Filter curated quick locations locally
  const filteredQuickLocations = useMemo(() => {
    if (!locationSearch.trim()) return QUICK_LOCATIONS.slice(0, 6);
    const q = locationSearch.toLowerCase();
    return QUICK_LOCATIONS.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 6);
  }, [locationSearch]);

  // Combined suggestions
  const combinedSuggestions = useMemo(() => {
    const list: LocationAnchor[] = [];
    // User GPS option always available at top
    list.push({
      name: '📍 Moje aktuální poloha (GPS)',
      lat: userCoords.lat,
      lng: userCoords.lng,
      isGps: true
    });

    // Add geocoded API results
    geocodedSuggestions.forEach((g) => list.push(g));

    // Add local matches that aren't duplicate
    filteredQuickLocations.forEach((l) => {
      if (!list.some((existing) => existing.name.toLowerCase() === l.name.toLowerCase())) {
        list.push(l);
      }
    });

    return list;
  }, [userCoords, geocodedSuggestions, filteredQuickLocations]);

  // Select a new anchor location
  const handleSelectAnchor = (newAnchor: LocationAnchor) => {
    soundFx.playDroplet();
    setAnchor(newAnchor);
    setLocationSearch('');
    setShowSuggestions(false);
  };

  // Reset to GPS location
  const handleResetToGps = () => {
    soundFx.playDroplet();
    setAnchor({
      name: 'Tvá aktuální poloha',
      lat: userCoords.lat,
      lng: userCoords.lng,
      isGps: true
    });
    setLocationSearch('');
    setShowSuggestions(false);
  };

  // Calculate distances and filter/sort spots around the CHOSEN ANCHOR LOCATION
  const spotsAroundAnchor = useMemo(() => {
    return spots
      .map((spot) => {
        const distKm = calculateDistanceKm(anchor.lat, anchor.lng, spot.lat, spot.lng);
        return { ...spot, distKm };
      })
      .filter((spot) => {
        // Distance from selected location anchor
        return spot.distKm <= radiusKm;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return a.distKm - b.distKm;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'reviews') {
          return b.reviewsCount - a.reviewsCount;
        }
        return 0;
      });
  }, [spots, anchor.lat, anchor.lng, radiusKm, sortBy]);

  const handleSpotClick = (spot: Spot) => {
    soundFx.playDroplet();
    onSelectSpot(spot);
    onClose();
  };

  const handlePanToAnchor = () => {
    soundFx.playDroplet();
    onSelectAnchorOnMap?.({ lat: anchor.lat, lng: anchor.lng, name: anchor.name });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#111827] text-black dark:text-white border-2 border-black rounded-3xl p-5 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15] text-black border border-black flex items-center justify-center text-lg font-black shadow-sm">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight text-black dark:text-white">
                HLEDAT MÍSTO & OKOLNÍ SPOTY
              </h3>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                Vyber město či lokalitu jako výchozí bod vyhledávání
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Location Search & Radius & Sort */}
        <div className="space-y-3 pt-3 pb-2 border-b border-black/10 dark:border-slate-800">
          
          {/* 1. VYHLEDÁVAČ KONKRÉTNÍCH MÍST / MĚST / LOKACÍ NA MAPĚ */}
          <div className="relative">
            <label className="block text-[11px] font-black uppercase text-slate-900 dark:text-white mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Výchozí bod na mapě (město, místo, adresa)</span>
              </span>
              {!anchor.isGps && (
                <button
                  type="button"
                  onClick={handleResetToGps}
                  className="text-[10px] text-amber-700 dark:text-yellow-400 hover:underline font-bold"
                >
                  ↺ Zpět na mou GPS polohu
                </button>
              )}
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={locationSearch}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Napiš město nebo místo (např. Brno, Špindlerův Mlýn, Vyšehrad...)"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-black rounded-xl text-xs font-bold text-black dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {isSearchingLocation && (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500 absolute right-3 top-2.5" />
              )}
            </div>

            {/* Suggestions Popover */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 border-2 border-black rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scroll divide-y divide-black/10 dark:divide-slate-800">
                {combinedSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectAnchor(item)}
                    className="p-2.5 px-3.5 text-xs font-bold hover:bg-amber-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-black dark:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{item.isGps ? '📍' : '🏙️'}</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Zvolit bod →</span>
                  </div>
                ))}
              </div>
            )}

            {/* Active Anchor Pill Indicator */}
            <div className="mt-2 flex items-center justify-between p-2 px-3 rounded-xl bg-amber-400/20 border border-black text-xs font-bold text-black dark:text-yellow-300">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-yellow-400" />
                <span className="truncate">Výchozí bod: <strong>{anchor.name}</strong></span>
              </div>
              <button
                type="button"
                onClick={handlePanToAnchor}
                className="text-[10px] font-black bg-[#facc15] hover:bg-yellow-400 text-black px-2.5 py-1 rounded-lg border border-black flex-shrink-0 shadow-sm ml-2"
              >
                Na mapu 🗺️
              </button>
            </div>
          </div>

          {/* 2. NASTAVENÍ OKRUHU KOLEM ZVOLENÉHO MÍSTA (KM) */}
          <div className="bg-slate-50 dark:bg-[#030712]/50 border border-black/15 dark:border-slate-800 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1 text-black dark:text-white">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Okruh kolem zvoleného místa:</span>
              </span>
              <span className="bg-[#facc15] text-black px-2.5 py-0.5 rounded-full border border-black text-xs font-mono font-black">
                {radiusKm} km
              </span>
            </div>

            {/* Range slider */}
            <input
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-yellow-400"
            />

            {/* Quick preset chips */}
            <div className="flex gap-1.5 justify-between pt-0.5">
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    soundFx.playDroplet();
                    setRadiusKm(preset);
                  }}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-black border transition ${
                    radiusKm === preset
                      ? 'bg-amber-400 text-black border-black shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-black/20 hover:bg-slate-100'
                  }`}
                >
                  {preset} km
                </button>
              ))}
            </div>
          </div>

          {/* 3. TŘÍDĚNÍ / FILTRY */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setSortBy('distance');
              }}
              className={`py-2 px-1 rounded-xl font-black border transition flex items-center justify-center gap-1 ${
                sortBy === 'distance'
                  ? 'bg-[#facc15] hover:bg-yellow-400 text-black border-black shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-black dark:text-slate-300 border-black/30 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Nejbližší</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setSortBy('rating');
              }}
              className={`py-2 px-1 rounded-xl font-black border transition flex items-center justify-center gap-1 ${
                sortBy === 'rating'
                  ? 'bg-[#facc15] hover:bg-yellow-400 text-black border-black shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-black dark:text-slate-300 border-black/30 hover:bg-slate-100'
              }`}
            >
              <UrineDrop size="xs" />
              <span>Dle kapek</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playDroplet();
                setSortBy('reviews');
              }}
              className={`py-2 px-1 rounded-xl font-black border transition flex items-center justify-center gap-1 ${
                sortBy === 'reviews'
                  ? 'bg-[#facc15] hover:bg-yellow-400 text-black border-black shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-black dark:text-slate-300 border-black/30 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Počet pissů</span>
            </button>
          </div>

        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto custom-scroll space-y-2.5 pt-3 pr-1">
          <div className="text-[11px] font-black text-slate-800 dark:text-slate-300 pb-1">
            Spoty v okruhu {radiusKm} km od: <span className="underline decoration-amber-500">{anchor.name}</span> ({spotsAroundAnchor.length})
          </div>

          {spotsAroundAnchor.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-2">
              <span className="text-3xl">🏜️</span>
              <h4 className="font-black text-sm text-black dark:text-white">
                V okruhu {radiusKm} km od tohoto místa není žádný spot
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Zkus zvětšit okruh posuvníkem (až na 50 km) nebo zvolit jiné město jako výchozí bod.
              </p>
            </div>
          ) : (
            spotsAroundAnchor.map((spot, idx) => (
              <div
                key={spot.id}
                onClick={() => handleSpotClick(spot)}
                className="bg-slate-50 dark:bg-slate-900/80 hover:bg-amber-100/50 dark:hover:bg-slate-800 border border-black/20 rounded-2xl p-3.5 cursor-pointer transition shadow-sm flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  {/* Category badge */}
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-black flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                    {CATEGORY_EMOJI[spot.category] || '⚡'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-500 font-mono">#{idx + 1}</span>
                      <h4 className="font-black text-sm text-black dark:text-white leading-tight group-hover:text-amber-700 dark:group-hover:text-yellow-400 transition">
                        {spot.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs mt-1 font-semibold flex-wrap">
                      {/* Distance from chosen anchor location */}
                      <span className="flex items-center gap-1 font-mono font-black text-black dark:text-yellow-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-yellow-400" />
                        {spot.distKm < 1 ? `${Math.round(spot.distKm * 1000)} m` : `${spot.distKm} km`}
                      </span>

                      <span>•</span>

                      {/* Yellow rating */}
                      <div className="flex items-center gap-1">
                        <UrineRating rating={spot.rating} size="xs" />
                        <span className="font-mono font-black text-black dark:text-white text-[11px]">
                          {spot.rating.toFixed(1)}
                        </span>
                      </div>

                      <span>•</span>

                      {/* Number of pisses */}
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                        {spot.reviewsCount} pissů
                      </span>
                    </div>

                    {spot.epiphany && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-400 italic line-clamp-1 mt-1">
                        "{spot.epiphany}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Show on map button */}
                <button
                  type="button"
                  className="px-3 py-2 bg-[#facc15] hover:bg-yellow-400 text-black font-black rounded-xl text-xs border border-black flex items-center gap-1 shadow-sm flex-shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Na mapu</span>
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
