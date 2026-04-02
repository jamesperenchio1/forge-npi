// A single uploaded photo with metadata
export type PhotoEntry = {
  url: string;       // base64 data URL (compressed)
  timestamp: string; // ISO 8601 — set automatically on upload
  comment?: string;  // optional user note / log entry
};

// Core plant type stored in localStorage
export type LocalPlant = {
  id: string;
  collector_tag: string;
  common_name: string;
  scientific_name?: string;
  health_status: 'healthy' | 'watch' | 'sick' | 'dormant';
  growing_system: 'soil' | 'kratky' | 'nft' | 'dwc' | 'semi_hydro';
  stage: 'seed' | 'seedling' | 'juvenile' | 'established' | 'specimen';
  notes?: string;
  added_at: string;
  cover_emoji?: string;
  photos?: PhotoEntry[];   // replaces the old string[] — each has url + timestamp + comment
  mainPhotoIndex?: number; // index into photos[] to use as primary avatar
  // Gemini-fetched details
  watering_needs?: string;
  sunlight_needs?: string;
  care_level?: string;
  description?: string;
  gemini_details_fetched?: boolean;
};

// Care log entry
export type CareLog = {
  id: string;
  plant_id: string;
  type: 'watered' | 'fertilized' | 'repotted' | 'pruned' | 'treated' | 'observation' | 'harvest' | 'noted';
  notes?: string;
  timestamp: string;
};

// Doctor consultation log
export type DoctorLog = {
  id: string;
  plant_id?: string;
  plant_name: string;
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  urgency: 'monitor' | 'act_this_week' | 'act_today' | 'emergency';
  symptoms_observed: string[];
  likely_cause: string;
  treatment_steps: { step: number; action: string; product?: string }[];
  prevention: string;
  seasonal_note?: string;
  timestamp: string;
  resolved: boolean;
  follow_up_notes?: string;
  image_preview?: string; // base64 thumbnail
};

// Container/pot in garden
export type Container = {
  id: string;
  name: string;
  x: number; // % position
  y: number;
  w: number; // % dimensions
  h: number;
  color: string;
  plantIds: string[];
  zone_id?: string;
  sections: PotSection[];
};

// A section within a pot (dividing it up)
export type PotSection = {
  id: string;
  label: string;
  plant_id?: string;
};

// Garden zone grouping containers
export type Zone = {
  id: string;
  name: string;
  color: string;
};

// Calendar event for planting schedule
export type CalendarEvent = {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  type: 'plant' | 'harvest' | 'fertilize' | 'water' | 'treat' | 'observe' | 'custom';
  plant_id?: string;
  plant_name: string;
  notes?: string;
  color?: string;
};

// A device in a hydroponic / grow setup for power cost calculation
export type HydroDevice = {
  id: string;
  name: string;
  category: 'pump' | 'airstone' | 'light' | 'fan' | 'heater' | 'sensor' | 'other';
  watts: number;
  hours_per_day: number;
  enabled: boolean;
};
