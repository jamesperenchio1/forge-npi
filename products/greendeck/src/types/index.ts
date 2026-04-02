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
  photos?: string[]; // base64 data URLs
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
