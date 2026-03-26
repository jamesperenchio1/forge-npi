"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix broken webpack/Turbopack asset handling for Leaflet default marker icons
const markerIcon = new L.Icon({
  iconUrl:       "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl:     "/leaflet/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LeafletMap({ lat, lng, onChange }: Props) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: "240px", width: "100%", borderRadius: "12px" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      <Marker position={[lat, lng]} icon={markerIcon} ref={markerRef} />
    </MapContainer>
  );
}
