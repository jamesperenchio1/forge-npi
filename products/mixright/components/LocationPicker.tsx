"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-60 bg-muted rounded-xl flex items-center justify-center">
      <span className="text-muted-foreground text-sm animate-pulse">Loading map…</span>
    </div>
  ),
});

interface Props {
  lat: number;
  lng: number;
  onConfirm: (lat: number, lng: number) => void;
  loading?: boolean;
}

export default function LocationPicker({ lat, lng, onConfirm, loading }: Props) {
  const [pendingLat, setPendingLat] = useState(lat);
  const [pendingLng, setPendingLng] = useState(lng);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  function handleMapClick(newLat: number, newLng: number) {
    setPendingLat(newLat);
    setPendingLng(newLng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setGpsError("GPS not available"); return; }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingLat(pos.coords.latitude);
        setPendingLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsError("Could not get location. Tap the map to set manually.");
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Tap the map to place your construction site</p>
        <Button
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={gpsLoading}
          className="text-xs gap-1"
        >
          <Navigation className="w-3 h-3" />
          {gpsLoading ? "Getting GPS…" : "Use my location"}
        </Button>
      </div>

      {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}

      <LeafletMap lat={pendingLat} lng={pendingLng} onChange={handleMapClick} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{pendingLat.toFixed(4)}°, {pendingLng.toFixed(4)}°</span>
        </div>
        <Button
          size="sm"
          onClick={() => onConfirm(pendingLat, pendingLng)}
          disabled={loading}
          className="gap-1"
        >
          {loading ? "Fetching weather…" : "Confirm location"}
        </Button>
      </div>
    </div>
  );
}
