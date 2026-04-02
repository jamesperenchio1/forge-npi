export type IconType = 'bug' | 'fly' | 'fungus' | 'mite' | 'aphid' | 'scale' | 'smoke' | 'blight' | 'mold';

export type PestEntry = {
  name: string;
  months: number[];
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  signs: string;
  region?: 'all' | 'north' | 'central' | 'south';
  emoji: string;
  type: 'pest' | 'disease';
  iconType: IconType;
  imageUrl?: string;
};

// Thailand-specific seasonal pest calendar
// Sources: Bangkok Post, Thai Garden Design, Sound Horticulture
export const THAILAND_PESTS: PestEntry[] = [
  {
    name: 'Mealybugs',
    months: [11, 12, 1, 2, 10],
    severity: 'high',
    signs: 'White cottony clusters at leaf joints, sooty mold follows',
    treatment: 'Neem oil spray, tobacco water, or isopropyl alcohol on cotton swab. Biological: Cryptolaemus beetles.',
    region: 'all',
    emoji: '🪲',
    type: 'pest',
    iconType: 'bug',
  },
  {
    name: 'Spider Mites',
    months: [3, 4, 5, 11, 12, 1],
    severity: 'high',
    signs: 'Fine webbing on leaves, stippled/bronze discolouration, leaf drop',
    treatment: 'Strong water spray, insecticidal soap every 4–5 days. Increase humidity.',
    region: 'all',
    emoji: '🕷️',
    type: 'pest',
    iconType: 'mite',
  },
  {
    name: 'Fungus Gnats',
    months: [5, 6, 7, 8, 9, 10],
    severity: 'medium',
    signs: 'Tiny black flies near soil, yellowing seedlings, root damage',
    treatment: 'Let top 3cm of soil dry fully. Yellow sticky traps. H₂O₂ drench (1:4 ratio).',
    region: 'all',
    emoji: '🪰',
    type: 'pest',
    iconType: 'fly',
  },
  {
    name: 'Thrips',
    months: [3, 4, 5, 6, 7],
    severity: 'medium',
    signs: 'Silver streaks on leaves, black excrement spots, distorted new growth',
    treatment: 'Neem oil, spinosad spray. Amblyseius cucumeris predatory mites for biocontrol.',
    region: 'all',
    emoji: '🐛',
    type: 'pest',
    iconType: 'bug',
  },
  {
    name: 'Aphids',
    months: [2, 3, 4, 11, 12],
    severity: 'low',
    signs: 'Clusters of soft insects on new growth, sticky honeydew, ant activity',
    treatment: 'Strong water blast, neem oil, soapy water spray. Encourage ladybugs.',
    region: 'all',
    emoji: '🐜',
    type: 'pest',
    iconType: 'aphid',
  },
  {
    name: 'Root Rot (Pythium)',
    months: [5, 6, 7, 8, 9, 10],
    severity: 'high',
    signs: 'Wilting despite wet soil, brown/mushy roots, yellowing leaves',
    treatment: 'Reduce watering. Improve drainage. Hydrogen peroxide drench. Remove affected roots.',
    region: 'all',
    emoji: '🍄',
    type: 'disease',
    iconType: 'fungus',
  },
  {
    name: 'Smoke/PM2.5 Damage',
    months: [2, 3, 4],
    severity: 'medium',
    signs: 'Leaf surface grime, reduced photosynthesis, slow growth',
    treatment: 'Wipe leaves with damp cloth. Move sensitive plants indoors. Avoid foliar feeding.',
    region: 'north',
    emoji: '💨',
    type: 'disease',
    iconType: 'smoke',
  },
  {
    name: 'Powdery Mildew',
    months: [11, 12, 1, 2, 3],
    severity: 'medium',
    signs: 'White powdery coating on leaves, distorted young growth, premature leaf drop',
    treatment: 'Baking soda spray (1 tsp/L water + few drops dish soap). Improve air circulation. Remove affected leaves.',
    region: 'all',
    emoji: '⬜',
    type: 'disease',
    iconType: 'mold',
  },
  {
    name: 'Leaf Blight (Alternaria)',
    months: [6, 7, 8, 9, 10],
    severity: 'medium',
    signs: 'Brown/black lesions with yellow halos, often starting at leaf tips, spreads in humid weather',
    treatment: 'Remove affected leaves immediately. Copper-based fungicide. Avoid overhead watering.',
    region: 'all',
    emoji: '🍂',
    type: 'disease',
    iconType: 'blight',
  },
  {
    name: 'Scale Insects',
    months: [1, 2, 3, 10, 11, 12],
    severity: 'medium',
    signs: 'Hard or soft bumps on stems/leaves, sticky honeydew, yellowing foliage',
    treatment: 'Scrape off manually. Neem oil or horticultural oil spray. Systemic insecticide for severe infestations.',
    region: 'all',
    emoji: '🦗',
    type: 'pest',
    iconType: 'scale',
  },
];

export function getPestsForMonth(month: number, region: string = 'all'): PestEntry[] {
  return THAILAND_PESTS.filter(
    (p) =>
      p.months.includes(month) &&
      (p.region === 'all' || p.region === region)
  ).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// Alias for getPestsForMonth
export const getMonthlyPests = getPestsForMonth;

export function getTopPestAlert(month: number, region: string = 'all'): PestEntry | null {
  const pests = getPestsForMonth(month, region);
  return pests[0] ?? null;
}
