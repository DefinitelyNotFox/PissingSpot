import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Spot, CategoryType, GroundType, UserProfile } from '../types/spot';
import { soundFx } from '../utils/audio';
import { UrineRating, UrineDrop } from './UrineDrop';
import { 
  X, 
  MapPin, 
  Camera, 
  Sparkles, 
  Shield, 
  Wind, 
  Flame,
  Plus,
  Trash2,
  Navigation
} from 'lucide-react';

interface PissModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSpot: (newSpot: Spot) => void;
  userCoords: { lat: number; lng: number };
  currentUser?: UserProfile;
}

const CATEGORIES: { id: CategoryType; label: string; icon: string }[] = [
  { id: 'view', label: 'Útes / Výhled', icon: '⛰️' },
  { id: 'nature', label: 'Les / Příroda', icon: '🌲' },
  { id: 'toilet', label: 'Veřejné WC', icon: '🚻' },
  { id: 'kadibudka', label: 'Kadibudka', icon: '🛖' },
  { id: 'toitoi', label: 'Toi-Toi', icon: '🚽' },
  { id: 'pub', label: 'Hospoda / WC', icon: '🍺' },
  { id: 'emergency', label: 'Nouzovka', icon: '⚠️' },
  { id: 'other', label: 'Jiné', icon: '✨' }
];

const GROUNDS: { id: GroundType; label: string }[] = [
  { id: 'mech', label: 'Mech / listí' },
  { id: 'trava', label: 'Tráva / hlína' },
  { id: 'sraz', label: 'Skalní sráz' },
  { id: 'sterk', label: 'Štěrk' },
  { id: 'keramika', label: 'Keramika / mušle' },
  { id: 'vrata', label: 'Plechová vrata' }
];

const HYDRO_LEVELS = [
  { level: 1, color: '#f8fafc' },
  { level: 2, color: '#fef08a' },
  { level: 3, color: '#facc15' },
  { level: 4, color: '#d97706' },
  { level: 5, color: '#78350f' }
];

export const PissModal: React.FC<PissModalProps> = ({
  isOpen,
  onClose,
  onAddSpot,
  userCoords,
  currentUser
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('view');
  const [customCategory, setCustomCategory] = useState('');
  const [lat, setLat] = useState(userCoords.lat);
  const [lng, setLng] = useState(userCoords.lng);

  // Ratings
  const [viewRating, setViewRating] = useState(5);
  const [privacyRating, setPrivacyRating] = useState(4);
  const [smellRating, setSmellRating] = useState(4);
  const [windRating, setWindRating] = useState(4);
  const [amenitiesRating, setAmenitiesRating] = useState(3);
  const [splashback, setSplashback] = useState(10);
  const [ground, setGround] = useState<GroundType>('mech');

  // Hydration & Epiphany
  const [hydroLevel, setHydroLevel] = useState(2);
  const [epiphany, setEpiphany] = useState('');
  const [lockCode, setLockCode] = useState('');

  // Photos State (Max 5 photos)
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Mini Map Picker
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!miniMapContainerRef.current) return;
    if (miniMapInstanceRef.current) return;

    const map = L.map(miniMapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'picker-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="
            width: 36px;
            height: 36px;
            background: #000000;
            color: #fde047;
            border: 2px solid #ffffff;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          ">
            ⚡
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #000000;
          "></div>
        </div>
      `,
      iconSize: [0, 0]
    });

    const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
    markerRef.current = marker;
    miniMapInstanceRef.current = map;

    // Click on map to place pin manually!
    map.on('click', (e: L.LeafletMouseEvent) => {
      soundFx.playDroplet();
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      setLat(newLat);
      setLng(newLng);
      marker.setLatLng([newLat, newLng]);
    });

    // Drag pin
    marker.on('dragend', () => {
      soundFx.playDroplet();
      const pos = marker.getLatLng();
      setLat(Number(pos.lat.toFixed(6)));
      setLng(Number(pos.lng.toFixed(6)));
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      miniMapInstanceRef.current = null;
    };
  }, []);

  const handleResetToGps = () => {
    soundFx.playDroplet();
    setLat(userCoords.lat);
    setLng(userCoords.lng);
    if (markerRef.current && miniMapInstanceRef.current) {
      markerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      miniMapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 16);
    }
  };

  const handleDropClick = (setter: (v: number) => void, val: number) => {
    soundFx.playDroplet();
    setter(val);
  };

  // Real Multi-photo File Upload (Max 5)
  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);

    const availableSlots = 5 - photos.length;
    if (availableSlots <= 0) {
      alert('Můžeš nahrát maximálně 5 fotografií.');
      return;
    }

    const filesToRead = selectedFiles.slice(0, availableSlots);

    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          soundFx.playDroplet();
          setPhotos((prev) => (prev.length < 5 ? [...prev, base64] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    soundFx.playDroplet();
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Zadej prosím název spotu!');
      return;
    }

    soundFx.playFlush();

    const avgRating = Number(
      ((viewRating + privacyRating + smellRating + windRating + amenitiesRating) / 5).toFixed(1)
    );

    const newSpot: Spot = {
      id: `spot-${Date.now()}`,
      title: title.trim(),
      category,
      customCategory: category === 'other' && customCategory.trim() ? customCategory.trim() : undefined,
      lat,
      lng,
      author: currentUser ? `${currentUser.username} (${currentUser.handle})` : 'Ty (@LordOfStreams)',
      authorHandle: currentUser?.handle || '@LordOfStreams',
      authorScope: 'me',
      rating: avgRating,
      initialRating: avgRating,
      ratings: [avgRating],
      reviewsCount: 1,
      comments: [],
      metrics: {
        view: viewRating,
        privacy: privacyRating,
        smell: smellRating,
        wind: windRating,
        amenities: amenitiesRating,
        splashback
      },
      ground,
      altitude: Math.floor(Math.random() * 400) + 200,
      epiphany: epiphany.trim() || undefined,
      lockCode: lockCode.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      images: photos.length > 0 ? photos : undefined,
      imageUrl: photos.length > 0 ? photos[0] : undefined
    };

    onAddSpot(newSpot);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-30 bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col overflow-y-auto custom-scroll animate-in fade-in duration-150">
      
      <div className="max-w-xl mx-auto w-full p-4 sm:p-6 space-y-4 pb-20">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15] text-black font-black flex items-center justify-center text-lg border border-black shadow-sm">
              ⚡
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Nový Pissing Spot
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#111827] border border-black dark:border-slate-800 text-slate-950 dark:text-white hover:opacity-80 flex items-center justify-center transition shadow-sm font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">

          {/* 1. LOKACE SPOTU – INTERAKTIVNÍ MAPA S KLIKNUTÍM PRO UMÍSTĚNÍ */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500 dark:text-yellow-400" /> Umístění na mapě
              </label>
              <span className="text-[11px] font-mono font-bold text-slate-950 dark:text-yellow-300 bg-amber-100 dark:bg-yellow-400/20 px-2 py-0.5 rounded-full border border-black/20 dark:border-yellow-400/30">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              👉 <strong>Klepni kamkoliv do mapy</strong> nebo přetáhni špendlík pro manuální umístění:
            </p>

            {/* Interactive Mini Map Picker Canvas */}
            <div className="h-44 w-full rounded-xl overflow-hidden border border-black dark:border-slate-800 relative shadow-inner">
              <div ref={miniMapContainerRef} className="w-full h-full" />
              <button
                type="button"
                onClick={handleResetToGps}
                className="absolute bottom-2 right-2 z-[400] px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-950 dark:text-white border border-black dark:border-slate-700 rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-slate-50"
              >
                <Navigation className="w-3 h-3 text-amber-500" />
                <span>Moje GPS poloha</span>
              </button>
            </div>
          </div>

          {/* 2. NÁZEV & KATEGORIE ZAŘÍZENÍ */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-1.5">
                Název spotu *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Útes na Vyhlídce Máj, ToiToi za nádražím..."
                className="w-full bg-slate-50 dark:bg-[#030712] border border-black dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-2">
                Kategorie zařízení
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundFx.playDroplet();
                      setCategory(cat.id);
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                      category === cat.id
                        ? 'bg-[#facc15] text-black font-black border-2 border-black shadow'
                        : 'bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-300 border-black/30 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[11px] leading-tight text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {category === 'other' && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">
                  Co to bylo za zařízení / místo?
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="např. Příkop u cesty, Za dodávkou, Telefonní budka..."
                  className="w-full bg-slate-50 dark:bg-[#030712] border border-black dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            )}

            {(category === 'toilet' || category === 'pub' || category === 'toitoi') && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 mb-1">
                  Kód na zámek (pokud existuje)
                </label>
                <input
                  type="text"
                  value={lockCode}
                  onChange={(e) => setLockCode(e.target.value)}
                  placeholder="např. 1234, *458#..."
                  className="w-full bg-slate-50 dark:bg-[#030712] border border-black dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-950 dark:text-yellow-300 font-mono focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 3. HODNOTÍCÍ METRIKY (1–5 ŽLUTÝCH KAPEK MOČI) */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <UrineDrop size="sm" /> <span>Hodnocení (1–5 kapek moči)</span>
              </label>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Výhled:</span>
                </div>
                <UrineRating
                  rating={viewRating}
                  size="md"
                  interactive={true}
                  onRate={(val) => handleDropClick(setViewRating, val)}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Soukromíčko:</span>
                </div>
                <UrineRating
                  rating={privacyRating}
                  size="md"
                  interactive={true}
                  onRate={(val) => handleDropClick(setPrivacyRating, val)}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="text-sm">🌸</span>
                  <span>Vůně:</span>
                </div>
                <UrineRating
                  rating={smellRating}
                  size="md"
                  interactive={true}
                  onRate={(val) => handleDropClick(setSmellRating, val)}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-blue-600" />
                  <span>Závětří:</span>
                </div>
                <UrineRating
                  rating={windRating}
                  size="md"
                  interactive={true}
                  onRate={(val) => handleDropClick(setWindRating, val)}
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-[#030712]/50 p-2.5 rounded-xl border border-black/10 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="text-sm">🧻</span>
                  <span>Výbava:</span>
                </div>
                <UrineRating
                  rating={amenitiesRating}
                  size="md"
                  interactive={true}
                  onRate={(val) => handleDropClick(setAmenitiesRating, val)}
                />
              </div>
            </div>
          </div>

          {/* 4. PODLOŽÍ & SPLASHBACK */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-black text-slate-950 dark:text-white mb-1">
                  Typ podloží
                </label>
                <select
                  value={ground}
                  onChange={(e) => setGround(e.target.value as GroundType)}
                  className="w-full bg-slate-50 dark:bg-[#030712] border border-black dark:border-slate-700 rounded-xl p-2.5 text-slate-950 dark:text-white focus:outline-none font-semibold"
                >
                  {GROUNDS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black text-slate-950 dark:text-white">
                    Splashback odraz
                  </label>
                  <span className="text-[11px] font-mono font-black text-blue-600 dark:text-cyan-400">
                    {splashback} %
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splashback}
                  onChange={(e) => setSplashback(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* 5. ODSTÍN MOČI */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm">
            <label className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
              <span>🧪</span> Odstín moči
            </label>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {HYDRO_LEVELS.map((h) => (
                <button
                  key={h.level}
                  type="button"
                  onClick={() => {
                    soundFx.playDroplet();
                    setHydroLevel(h.level);
                  }}
                  style={{ backgroundColor: h.color }}
                  className={`h-8 rounded-xl border border-black transition transform hover:scale-105 ${
                    hydroLevel === h.level ? 'ring-2 ring-black dark:ring-yellow-400 scale-105 shadow-md' : 'opacity-80'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 6. TOALETNÍ FILOZOFIE */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
              💭 Toaletní filozofie
            </label>
            <textarea
              rows={2}
              value={epiphany}
              onChange={(e) => setEpiphany(e.target.value)}
              placeholder="Jaká hluboká myšlenka tě u této akce napadla?"
              className="w-full bg-slate-50 dark:bg-[#030712] border border-black dark:border-slate-700 rounded-xl p-3 text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* 7. REÁLNÉ NAHRÁNÍ FOTOGRAFIÍ (MAX 5 S VÝBĚREM SOUBORŮ) */}
          <div className="bg-white dark:bg-[#111827] border border-black dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-500 dark:text-yellow-400" /> Foto výhledu / toalety
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                {photos.length} / 5 fotografií
              </span>
            </div>

            {/* Hidden real file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handlePhotoFiles}
              className="hidden"
            />

            {/* Photo thumbnails gallery */}
            {photos.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((imgSrc, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-black aspect-square bg-slate-100">
                    <img src={imgSrc} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white rounded-full p-1 transition"
                      title="Smazat fotku"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-black dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#030712] rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-slate-950 dark:text-white">
                  <Plus className="w-4 h-4" />
                  <span>Připojit fotky z telefonu / disku (max 5)</span>
                </div>
                <span className="text-[10px] text-slate-500">Formáty JPG, PNG, WEBP</span>
              </button>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full py-4 bg-[#facc15] hover:bg-yellow-400 text-black font-black text-base rounded-2xl shadow-xl border-2 border-black flex items-center justify-center gap-2 transform active:scale-95 transition"
          >
            <Flame className="w-5 h-5 fill-current text-black" />
            <span>OKLEPAT & SPLÁCHNOUT 🚽</span>
          </button>

        </form>

      </div>
    </div>
  );
};
