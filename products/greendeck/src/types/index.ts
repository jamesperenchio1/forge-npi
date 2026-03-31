// Core domain types for GreenDeck

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Garden = {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lon: number;
  created_at: string;
};

export type Container = {
  id: string;
  garden_id: string;
  name: string;
  type: "pot" | "raised-bed" | "grow-bag" | "hydroponics" | "in-ground";
  width_cm: number;
  depth_cm: number;
  x: number; // canvas position
  y: number;
};

export type Plant = {
  id: string;
  container_id: string;
  common_name: string;
  scientific_name?: string;
  planted_at: string;
  notes?: string;
  perenual_id?: number;
};

export type PlantPhoto = {
  id: string;
  plant_id: string;
  url: string;
  taken_at: string;
  notes?: string;
};

export type HydroSystem = {
  id: string;
  garden_id: string;
  name: string;
  type: "NFT" | "DWC" | "Kratky" | "Ebb-and-Flow" | "Wicking";
  channels: number;
  nutrients_ppm?: number;
  ph?: number;
  last_checked?: string;
};

export type WeatherSnapshot = {
  lat: number;
  lon: number;
  temp_c: number;
  humidity_pct: number;
  wind_kmh: number;
  fetched_at: string;
};
