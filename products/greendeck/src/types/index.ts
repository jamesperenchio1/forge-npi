// === Supabase Row Types (from Database) ===

export type PlantRow = {
  id: string;
  user_id: string;
  collector_tag: string;
  common_name: string;
  scientific_name?: string;
  health_status: "healthy" | "watch" | "sick" | "dormant";
  growing_system: "soil" | "kratky" | "nft" | "dwc" | "semi_hydro";
  stage: "seed" | "seedling" | "juvenile" | "established" | "specimen";
  notes?: string;
  cover_emoji?: string;
  main_photo_index: number;
  watering_needs?: string;
  sunlight_needs?: string;
  care_level?: string;
  description?: string;
  gemini_details_fetched: boolean;
  added_at: string;
  plant_photos?: Array<{ id: string; url: string; comment?: string; taken_at: string }>;
  care_logs?: Array<{ id: string; type: string; note?: string; logged_at: string }>;
};

export type PhotoRow = {
  id: string;
  plant_id: string;
  user_id: string;
  url: string;
  comment?: string;
  taken_at: string;
  sort_order: number;
};

export type CareLogRow = {
  id: string;
  user_id: string;
  plant_id: string;
  type: string;
  note?: string;
  logged_at: string;
};

export type DoctorLogRow = {
  id: string;
  user_id: string;
  plant_id?: string;
  plant_name?: string;
  condition?: string;
  urgency?: string;
  severity?: string;
  confidence?: number;
  treatment?: any;
  resolved: boolean;
  logged_at: string;
};

export type ZoneRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type ContainerRow = {
  id: string;
  user_id: string;
  zone_id?: string;
  name: string;
  size: string;
  grid_w: number;
  grid_h: number;
  pos_x: number;
  pos_y: number;
  created_at: string;
  container_sections?: Array<{ id: string; label: string; plant_id?: string; sort_order: number }>;
};

export type SectionRow = {
  id: string;
  container_id: string;
  user_id: string;
  label: string;
  plant_id?: string;
  sort_order: number;
};

export type CalendarEventRow = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  type: string;
  plant_id?: string;
  note?: string;
  created_at: string;
};

export type HydroDeviceRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  watts: number;
  hours_per_day: number;
  enabled: boolean;
  created_at: string;
};

export type UserPrefsRow = {
  user_id: string;
  electricity_rate_thb: number;
  location_lat?: number;
  location_lon?: number;
  location_name?: string;
  updated_at: string;
};

// === Legacy Types (for backward compatibility) ===

export type PhotoEntry = {
  url: string;
  timestamp: string;
  comment?: string;
};

export type LocalPlant = {
  id: string;
  collector_tag: string;
  common_name: string;
  scientific_name?: string;
  health_status: "healthy" | "watch" | "sick" | "dormant";
  growing_system: "soil" | "kratky" | "nft" | "dwc" | "semi_hydro";
  stage: "seed" | "seedling" | "juvenile" | "established" | "specimen";
  notes?: string;
  added_at: string;
  cover_emoji?: string;
  photos?: PhotoEntry[];
  mainPhotoIndex?: number;
  watering_needs?: string;
  sunlight_needs?: string;
  care_level?: string;
  description?: string;
  gemini_details_fetched?: boolean;
};

export type CareLog = {
  id: string;
  plant_id: string;
  type: "watered" | "fertilized" | "repotted" | "pruned" | "treated" | "observation" | "harvest" | "noted";
  notes?: string;
  timestamp: string;
};

export type DoctorLog = {
  id: string;
  plant_id?: string;
  plant_name: string;
  condition: string;
  confidence: "high" | "medium" | "low";
  severity: "none" | "mild" | "moderate" | "severe";
  urgency: "monitor" | "act_this_week" | "act_today" | "emergency";
  symptoms_observed: string[];
  likely_cause: string;
  treatment_steps: { step: number; action: string; product?: string }[];
  prevention: string;
  seasonal_note?: string;
  timestamp: string;
  resolved: boolean;
  follow_up_notes?: string;
  image_preview?: string;
};

export type Container = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  plantIds: string[];
  zone_id?: string;
  sections: PotSection[];
};

export type PotSection = {
  id: string;
  label: string;
  plant_id?: string;
};

export type Zone = {
  id: string;
  name: string;
  color: string;
};

export type CalendarEvent = {
  id: string;
  date: string;
  type: "plant" | "harvest" | "fertilize" | "water" | "treat" | "observe" | "custom";
  plant_id?: string;
  plant_name: string;
  notes?: string;
  color?: string;
};

export type HydroDevice = {
  id: string;
  name: string;
  category: "pump" | "airstone" | "light" | "fan" | "heater" | "sensor" | "other";
  watts: number;
  hours_per_day: number;
  enabled: boolean;
};
