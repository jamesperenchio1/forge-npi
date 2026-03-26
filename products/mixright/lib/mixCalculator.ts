import {
  MIX_CLASS_BASE_WCR,
  MIX_PROPORTIONS,
  SAND_ADJUSTMENTS,
  getHumidityWaterAdj,
  getTempWaterAdj,
  getCementAgeWarning,
  getCureTime,
} from "./constants";

export interface MixInputs {
  mixClass: "A" | "B" | "C";
  applicationId: string;
  sandType: "river" | "crushed" | "mixed";
  cementAgeMonths: number;
  temperatureC: number;
  humidityPct: number;
  numBags: number; // how many 50kg bags they're mixing
}

export interface MixResult {
  waterPerBag: number;       // liters of water to add per 50kg bag
  totalWater: number;        // total liters for all bags
  bucketsPerBag: {
    cement: number;
    sand: number;
    gravel: number;
  };
  totalBuckets: {
    cement: number;
    sand: number;
    gravel: number;
  };
  wcr: number;               // final water-cement ratio used
  cureTime: ReturnType<typeof getCureTime>;
  cementWarning: ReturnType<typeof getCementAgeWarning>;
  adjustments: {
    humidity: number;
    temperature: number;
    sandType: number;
  };
}

// Standard 20L builder's bucket — common in SEA
const BUCKET_VOLUME_L = 20;
// 1 bag cement (50kg) ≈ 33.3L loose volume
const CEMENT_BAG_VOLUME_L = 33.3;

export function calculateMix(inputs: MixInputs): MixResult {
  const { mixClass, applicationId, sandType, cementAgeMonths, temperatureC, humidityPct, numBags } = inputs;

  // Base water-cement ratio
  const baseWcr = MIX_CLASS_BASE_WCR[mixClass];

  // Water adjustments (in liters per 50kg bag)
  const humidityAdj = getHumidityWaterAdj(humidityPct);
  const tempAdj = getTempWaterAdj(temperatureC);
  const sandWcrAdj = SAND_ADJUSTMENTS[sandType];

  // Final WCR (sand type adjusts the ratio, humidity/temp adjust absolute water amount)
  const finalWcr = baseWcr + sandWcrAdj;

  // Base water per 50kg bag (50kg * wcr = kg water, 1kg water ≈ 1L)
  const baseWaterPerBag = 50 * finalWcr;

  // Adjusted water per bag (humidity and temp shift absolute water by small amounts)
  const waterPerBag = Math.max(10, Math.round((baseWaterPerBag + humidityAdj + tempAdj) * 10) / 10);

  // Mix proportions (1 bag cement = 1 unit volume = CEMENT_BAG_VOLUME_L)
  const props = MIX_PROPORTIONS[mixClass];
  const sandVolume = props.sand * CEMENT_BAG_VOLUME_L;
  const gravelVolume = props.gravel * CEMENT_BAG_VOLUME_L;

  const bucketsPerBag = {
    cement: 1.67, // 1 bag = 33.3L ≈ 1.67 × 20L buckets (just tell them "1 bag")
    sand: Math.round((sandVolume / BUCKET_VOLUME_L) * 10) / 10,
    gravel: Math.round((gravelVolume / BUCKET_VOLUME_L) * 10) / 10,
  };

  const totalBuckets = {
    cement: Math.round(bucketsPerBag.cement * numBags * 10) / 10,
    sand: Math.round(bucketsPerBag.sand * numBags * 10) / 10,
    gravel: Math.round(bucketsPerBag.gravel * numBags * 10) / 10,
  };

  return {
    waterPerBag,
    totalWater: Math.round(waterPerBag * numBags * 10) / 10,
    bucketsPerBag,
    totalBuckets,
    wcr: Math.round(finalWcr * 100) / 100,
    cureTime: getCureTime(humidityPct, applicationId),
    cementWarning: getCementAgeWarning(cementAgeMonths),
    adjustments: {
      humidity: humidityAdj,
      temperature: tempAdj,
      sandType: sandWcrAdj,
    },
  };
}
