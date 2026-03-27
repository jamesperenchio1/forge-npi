import {
  MIX_CLASSES,
  MixClassKey,
  APPLICATION_TYPES,
  SAND_ADJUSTMENTS,
  getHumidityWaterAdj,
  getTempWaterAdj,
  getCementAgeWarning,
  getCureTime,
} from "./constants";

export interface SelectedApp {
  applicationId: string;
  numBags: number;
  mixClassOverride?: MixClassKey; // if user wants to override the recommendation
}

export interface AppMixResult {
  applicationId: string;
  applicationLabel: string;
  numBags: number;
  mixClass: MixClassKey;
  waterPerBag: number;     // L
  totalWater: number;      // L
  buckets: { sand: number; gravel: number };
  totalBuckets: { sand: number; gravel: number };
  cureTime: ReturnType<typeof getCureTime>;
}

export interface MultiMixResult {
  perApp: AppMixResult[];
  totals: {
    totalBags: number;
    totalWater: number;
    totalSandBuckets: number;
    totalGravelBuckets: number;
  };
  cementWarning: ReturnType<typeof getCementAgeWarning>;
  adjustments: { humidity: number; temperature: number };
}

const BUCKET_L = 20;          // standard 20L builder bucket
const CEMENT_BAG_L = 33.3;    // 50kg cement bag ≈ 33.3L loose volume

export function calculateMultiMix(
  selectedApps: SelectedApp[],
  sandType: "river" | "crushed" | "mixed",
  cementAgeMonths: number,
  temperatureC: number,
  humidityPct: number
): MultiMixResult {
  const humidityAdj  = getHumidityWaterAdj(humidityPct);
  const tempAdj      = getTempWaterAdj(temperatureC);
  const sandWcrAdj   = SAND_ADJUSTMENTS[sandType];

  const perApp: AppMixResult[] = selectedApps.map(sel => {
    const appType    = APPLICATION_TYPES.find(a => a.id === sel.applicationId)!;
    const mixKey     = sel.mixClassOverride ?? appType.recommended;
    const mixClass   = MIX_CLASSES[mixKey];

    const finalWcr   = mixClass.wcr + sandWcrAdj;
    const baseWater  = 50 * finalWcr;
    const waterPerBag = Math.max(10, Math.round((baseWater + humidityAdj + tempAdj) * 10) / 10);

    const sandPerBag   = Math.round((mixClass.proportions.sand   * CEMENT_BAG_L / BUCKET_L) * 10) / 10;
    const gravelPerBag = Math.round((mixClass.proportions.gravel * CEMENT_BAG_L / BUCKET_L) * 10) / 10;

    return {
      applicationId:    sel.applicationId,
      applicationLabel: appType.label,
      numBags:          sel.numBags,
      mixClass:         mixKey,
      waterPerBag,
      totalWater:       Math.round(waterPerBag * sel.numBags * 10) / 10,
      buckets: { sand: sandPerBag, gravel: gravelPerBag },
      totalBuckets: {
        sand:   Math.round(sandPerBag   * sel.numBags * 10) / 10,
        gravel: Math.round(gravelPerBag * sel.numBags * 10) / 10,
      },
      cureTime: getCureTime(humidityPct, appType.isStructural),
    };
  });

  const totalBags         = perApp.reduce((s, a) => s + a.numBags, 0);
  const totalWater        = Math.round(perApp.reduce((s, a) => s + a.totalWater, 0) * 10) / 10;
  const totalSandBuckets  = Math.round(perApp.reduce((s, a) => s + a.totalBuckets.sand,   0) * 10) / 10;
  const totalGravelBuckets = Math.round(perApp.reduce((s, a) => s + a.totalBuckets.gravel, 0) * 10) / 10;

  return {
    perApp,
    totals: { totalBags, totalWater, totalSandBuckets, totalGravelBuckets },
    cementWarning: getCementAgeWarning(cementAgeMonths),
    adjustments: { humidity: humidityAdj, temperature: tempAdj },
  };
}
