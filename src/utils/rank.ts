export interface PissRankTier {
  rank: number;
  title: string;
  vessel: string;
  minLiters: number;
  nextTargetLiters: number;
  objectDescription: string;
  icon: string;
}

export const PISS_RANK_TIERS: PissRankTier[] = [
  {
    rank: 1,
    title: 'Dvoulitrovka Braníka',
    vessel: 'Dvoulitrovka Braníka (2 L)',
    minLiters: 0,
    nextTargetLiters: 2,
    objectDescription: 'Základní výbava každého lavičkového filozofa. Gratulujeme k prvnímu recyklovanému balení.',
    icon: '🍺'
  },
  {
    rank: 2,
    title: 'Kanystr do sekačky Mountfield',
    vessel: 'Kanystr do sekačky Mountfield (10 L)',
    minLiters: 2,
    nextTargetLiters: 10,
    objectDescription: 'Palivo do motoru tvého víkendového otroctví na zahradě. Tímhle bys sekal trávník až do neděle.',
    icon: '⛽'
  },
  {
    rank: 3,
    title: 'Dubový barikový sud archivního vína Château de Pipi Grand Cru 1984',
    vessel: 'Dubový barikový sud archivního vína (50 L)',
    minLiters: 10,
    nextTargetLiters: 50,
    objectDescription: 'Plný sud výběru z bobulí vrácený zpět přírodě. Someliér omdlévá, ledviny slaví absolutní ročník.',
    icon: '🍷'
  },
  {
    rank: 4,
    title: 'Obří akvárko se závojnatkami z čekárny u zubaře',
    vessel: 'Obří akvárko se závojnatkami (100 L)',
    minLiters: 50,
    nextTargetLiters: 100,
    objectDescription: 'Nemo by se v tomhle hledal dost blbě.',
    icon: '🐠'
  },
  {
    rank: 5,
    title: 'Dětský nafukovací bazének s plameňákem',
    vessel: 'Dětský nafukovací bazének s plameňákem (250 L)',
    minLiters: 100,
    nextTargetLiters: 250,
    objectDescription: 'Dokonalá imitace termálního pramene na zahradě. Teplota vody stabilních 37 °C i bez ohřevu.',
    icon: '🦩'
  },
  {
    rank: 6,
    title: 'Zahradní vířivka Jacuzzi pro čtyři',
    vessel: 'Zahradní vířivka Jacuzzi pro čtyři (1 200 L)',
    minLiters: 250,
    nextTargetLiters: 1200,
    objectDescription: 'Bublinky na vlastní pohon. Wellness zážitek, který nechceš zažít ani z dálky.',
    icon: '♨️'
  },
  {
    rank: 7,
    title: 'Nádrž hasičské cisterny Tatra 815',
    vessel: 'Nádrž hasičské cisterny Tatra 815 (8 000 L)',
    minLiters: 1200,
    nextTargetLiters: 8000,
    objectDescription: 'Krizový management v pohotovosti. Můžeš vyrazit hasit požáry trávy podél trati.',
    icon: '🚒'
  },
  {
    rank: 8,
    title: 'Železniční cisternový vagon ČD Cargo',
    vessel: 'Železniční cisternový vagon ČD Cargo (60 000 L)',
    minLiters: 8000,
    nextTargetLiters: 60000,
    objectDescription: 'Celá vlaková souprava nebezpečného chemického nákladu. Drážní inspekce raději odvrací zrak.',
    icon: '🚆'
  },
  {
    rank: 9,
    title: 'Městské koupaliště',
    vessel: 'Městské koupaliště (600 000 L)',
    minLiters: 60000,
    nextTargetLiters: 600000,
    objectDescription: 'Už tak je plný chcanků, takže tvůj příspěvek vlastně nikdo ani nepozná.',
    icon: '🏊'
  },
  {
    rank: 10,
    title: 'Olympijský padesátimetrový bazén',
    vessel: 'Olympijský 50m bazén (2 500 000 L / 2 500 m³)',
    minLiters: 600000,
    nextTargetLiters: 2500000,
    objectDescription: 'Dva a půl milionu litrů. Michael Phelps by odmítl skočit i v celotělovém neoprenu.',
    icon: '🏊‍♂️'
  },
  {
    rank: 11,
    title: 'Rybník Rožmberk',
    vessel: 'Rybník Rožmberk (cca 6 000 000 000 L / 6 mil. m³)',
    minLiters: 2500000,
    nextTargetLiters: 6000000000,
    objectDescription: 'Jakub Krčín by smeknul klobouk. Jihočeská rybniční soustava má nového kaprmistra.',
    icon: '🐟'
  },
  {
    rank: 12,
    title: 'Vodní nádrž Lipno',
    vessel: 'Vodní nádrž Lipno (306 000 000 000 L / 306 mil. m³)',
    minLiters: 6000000000,
    nextTargetLiters: 306000000000,
    objectDescription: 'Jihočeské moře z vlastních zdrojů. Jachtaři děkují za příliv, ekologové páchají hromadné harakiri.',
    icon: '🌊'
  }
];

export function formatLiters(liters: number): string {
  if (liters >= 1_000_000_000) {
    const b = liters / 1_000_000_000;
    return `${Number.isInteger(b) ? b : b.toFixed(1)} mld. L`;
  }
  if (liters >= 1_000_000) {
    const m = liters / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)} mil. L`;
  }
  return `${liters.toLocaleString('cs-CZ')} L`;
}

export function getPissRank(liters: number): {
  rank: number;
  title: string;
  vessel: string;
  filledVesselText: string;
  formattedRank: string;
  currentLiters: number;
  targetLiters: number;
  xpText: string;
  progressPercent: number;
  objectDescription: string;
  nextTierTitle?: string;
} {
  const currentTier = [...PISS_RANK_TIERS].reverse().find(t => liters >= t.minLiters) || PISS_RANK_TIERS[0];
  const target = currentTier.nextTargetLiters;
  const current = liters;
  const range = target - currentTier.minLiters;
  const progressInRange = current - currentTier.minLiters;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInRange / range) * 100)));

  const nextTier = PISS_RANK_TIERS.find(t => t.rank === currentTier.rank + 1);

  const currentFormatted = current.toLocaleString('cs-CZ');
  const targetFormatted = target.toLocaleString('cs-CZ');

  // Nádoba, která už je kompletně naplněná
  const filledTier = [...PISS_RANK_TIERS].reverse().find(t => current >= t.nextTargetLiters);
  let filledVesselText = '';
  if (!filledTier) {
    filledVesselText = `Zatím ani ${PISS_RANK_TIERS[0].title}`;
  } else if (current === filledTier.nextTargetLiters) {
    filledVesselText = filledTier.title;
  } else {
    filledVesselText = `${filledTier.title} a pár kapek k tomu`;
  }

  return {
    rank: currentTier.rank,
    title: currentTier.title,
    vessel: currentTier.vessel,
    filledVesselText,
    formattedRank: `Level ${currentTier.rank} - ${currentTier.title}`,
    currentLiters: current,
    targetLiters: target,
    xpText: `${currentFormatted}/${targetFormatted} L`,
    progressPercent,
    objectDescription: currentTier.objectDescription,
    nextTierTitle: nextTier ? `Level ${nextTier.rank} - ${nextTier.title}` : undefined
  };
}

export interface PissCountry {
  code: string;
  name: string;
  flag: string;
}

export function getCountryForSpot(spot: { lat: number; lng: number; tags?: string[]; title?: string }): PissCountry {
  const { lat, lng, tags = [], title = '' } = spot;
  const fullText = (tags.join(' ') + ' ' + title).toLowerCase();

  // Keyword / Text check first
  if (fullText.includes('rakousk') || fullText.includes('austria') || fullText.includes('wien') || fullText.includes('alpy') || fullText.includes('grossglockner')) {
    return { code: 'AT', name: 'Rakousko', flag: '🇦🇹' };
  }
  if (fullText.includes('slovensk') || fullText.includes('tatry') || fullText.includes('bratislav') || fullText.includes('rysy')) {
    return { code: 'SK', name: 'Slovensko', flag: '🇸🇰' };
  }
  if (fullText.includes('německ') || fullText.includes('germany') || fullText.includes('berlin') || fullText.includes('drážďan')) {
    return { code: 'DE', name: 'Německo', flag: '🇩🇪' };
  }
  if (fullText.includes('polsk') || fullText.includes('poland') || fullText.includes('krakow') || fullText.includes('warszaw')) {
    return { code: 'PL', name: 'Polsko', flag: '🇵🇱' };
  }
  if (fullText.includes('chorvatsk') || fullText.includes('croatia') || fullText.includes('jadran')) {
    return { code: 'HR', name: 'Chorvatsko', flag: '🇭🇷' };
  }
  if (fullText.includes('itál') || fullText.includes('italy') || fullText.includes('řím') || fullText.includes('dolomit')) {
    return { code: 'IT', name: 'Itálie', flag: '🇮🇹' };
  }

  // Geocoding bounding boxes (lat/lng)
  if (lat >= 48.55 && lat <= 51.06 && lng >= 12.09 && lng <= 18.86) {
    return { code: 'CZ', name: 'Česko', flag: '🇨🇿' };
  }
  if (lat >= 47.73 && lat <= 49.61 && lng >= 16.83 && lng <= 22.57) {
    return { code: 'SK', name: 'Slovensko', flag: '🇸🇰' };
  }
  if (lat >= 46.37 && lat <= 49.02 && lng >= 9.53 && lng <= 17.16) {
    return { code: 'AT', name: 'Rakousko', flag: '🇦🇹' };
  }
  if (lat >= 47.27 && lat <= 55.06 && lng >= 5.87 && lng <= 15.04) {
    return { code: 'DE', name: 'Německo', flag: '🇩🇪' };
  }
  if (lat >= 49.00 && lat <= 54.84 && lng >= 14.12 && lng <= 24.15) {
    return { code: 'PL', name: 'Polsko', flag: '🇵🇱' };
  }
  if (lat >= 42.39 && lat <= 46.55 && lng >= 13.49 && lng <= 19.45) {
    return { code: 'HR', name: 'Chorvatsko', flag: '🇭🇷' };
  }
  if (lat >= 36.65 && lat <= 47.09 && lng >= 6.63 && lng <= 18.52) {
    return { code: 'IT', name: 'Itálie', flag: '🇮🇹' };
  }
  if (lat >= 36.00 && lat <= 43.79 && lng >= -9.30 && lng <= 3.33) {
    return { code: 'ES', name: 'Španělsko', flag: '🇪🇸' };
  }
  if (lat >= 42.33 && lat <= 51.09 && lng >= -4.79 && lng <= 8.23) {
    return { code: 'FR', name: 'Francie', flag: '🇫🇷' };
  }

  // Default fallback
  return { code: 'CZ', name: 'Česko', flag: '🇨🇿' };
}
