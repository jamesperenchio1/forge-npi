'use client';

import { useState, useEffect } from 'react';
import { HydroDevice } from '@/types';

const STORAGE_KEY = 'greendeck_hydro';
const RATE_KEY = 'greendeck_hydro_rate';

const DEFAULT_RATE_THB = 4.15; // Thailand PEA/MEA residential Tier 2, 2024
const USD_PER_THB = 0.027;

const DEVICE_PRESETS: Omit<HydroDevice, 'id' | 'enabled'>[] = [
  { name: 'Water Pump (small)', category: 'pump', watts: 10, hours_per_day: 24 },
  { name: 'Water Pump (medium)', category: 'pump', watts: 20, hours_per_day: 24 },
  { name: 'Airstone / Air Pump', category: 'airstone', watts: 5, hours_per_day: 24 },
  { name: 'LED Grow Light 30W', category: 'light', watts: 30, hours_per_day: 16 },
  { name: 'LED Grow Light 60W', category: 'light', watts: 60, hours_per_day: 16 },
  { name: 'Clip Fan', category: 'fan', watts: 8, hours_per_day: 18 },
  { name: 'Heat Mat', category: 'heater', watts: 12, hours_per_day: 12 },
  { name: 'pH / EC Meter (powered)', category: 'sensor', watts: 2, hours_per_day: 24 },
];

const CATEGORY_COLORS: Record<HydroDevice['category'], string> = {
  pump: 'bg-blue-100 text-blue-700',
  airstone: 'bg-cyan-100 text-cyan-700',
  light: 'bg-amber-100 text-amber-700',
  fan: 'bg-teal-100 text-teal-700',
  heater: 'bg-orange-100 text-orange-700',
  sensor: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadDevices(): HydroDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveDevices(devices: HydroDevice[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(devices)); } catch {}
}

function loadRate(): number {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    return raw ? parseFloat(raw) : DEFAULT_RATE_THB;
  } catch { return DEFAULT_RATE_THB; }
}

function saveRate(rate: number) {
  try { localStorage.setItem(RATE_KEY, String(rate)); } catch {}
}

export default function HydroponicsPage() {
  const [devices, setDevices] = useState<HydroDevice[]>([]);
  const [rateTHB, setRateTHB] = useState(DEFAULT_RATE_THB);
  const [showPresets, setShowPresets] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newWatts, setNewWatts] = useState('');
  const [newHours, setNewHours] = useState('24');
  const [newCategory, setNewCategory] = useState<HydroDevice['category']>('other');

  useEffect(() => {
    setDevices(loadDevices());
    setRateTHB(loadRate());
  }, []);

  function updateDevices(next: HydroDevice[]) {
    setDevices(next);
    saveDevices(next);
  }

  function updateRate(r: number) {
    setRateTHB(r);
    saveRate(r);
  }

  function addPreset(preset: Omit<HydroDevice, 'id' | 'enabled'>) {
    updateDevices([...devices, { ...preset, id: uid(), enabled: true }]);
    setShowPresets(false);
  }

  function addCustom() {
    const w = parseFloat(newWatts);
    if (!newName.trim() || isNaN(w) || w <= 0) return;
    const h = Math.min(24, Math.max(0, parseFloat(newHours) || 24));
    updateDevices([...devices, { id: uid(), name: newName.trim(), category: newCategory, watts: w, hours_per_day: h, enabled: true }]);
    setNewName(''); setNewWatts(''); setNewHours('24'); setNewCategory('other');
  }

  function toggleDevice(id: string) {
    updateDevices(devices.map((d) => d.id === id ? { ...d, enabled: !d.enabled } : d));
  }

  function deleteDevice(id: string) {
    updateDevices(devices.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function updateField(id: string, field: keyof HydroDevice, value: string | number | boolean) {
    updateDevices(devices.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }

  const activeDevices = devices.filter((d) => d.enabled);
  const totalWatts = activeDevices.reduce((sum, d) => sum + d.watts, 0);
  const dailyKWh = activeDevices.reduce((sum, d) => sum + (d.watts * d.hours_per_day) / 1000, 0);
  const monthlyCostTHB = dailyKWh * 30 * rateTHB;
  const yearlyCostTHB = dailyKWh * 365 * rateTHB;
  const dailyCostTHB = dailyKWh * rateTHB;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>Hydroponics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Power usage and electricity cost calculator</p>
      </div>

      {/* Cost summary */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Running Cost</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Daily', thb: dailyCostTHB, kwh: dailyKWh },
            { label: 'Monthly', thb: monthlyCostTHB, kwh: dailyKWh * 30 },
            { label: 'Yearly', thb: yearlyCostTHB, kwh: dailyKWh * 365 },
          ].map(({ label, thb, kwh }) => (
            <div key={label} className="rounded-xl bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-base font-bold text-primary">฿{thb.toFixed(thb < 10 ? 2 : 0)}</p>
              <p className="text-xs text-muted-foreground">${(thb * USD_PER_THB).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kwh.toFixed(2)} kWh</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
          <span className="text-muted-foreground">Active draw</span>
          <span className="font-semibold">{totalWatts}W — {activeDevices.length} device{activeDevices.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Electricity rate */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Electricity Rate</p>
            <p className="text-xs text-muted-foreground">Default: 4.15 THB/kWh (Thailand PEA residential)</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              type="number"
              value={rateTHB}
              step="0.01"
              min="0.1"
              onChange={(e) => updateRate(parseFloat(e.target.value) || DEFAULT_RATE_THB)}
              className="w-20 rounded-xl border border-border bg-input px-2 py-1.5 text-sm text-right"
            />
            <span className="text-sm text-muted-foreground">THB/kWh</span>
          </div>
        </div>
      </div>

      {/* Device list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Devices</p>
          <button onClick={() => setShowPresets(!showPresets)} className="text-xs font-medium text-primary">
            + Add Preset
          </button>
        </div>

        {showPresets && (
          <div className="rounded-2xl bg-card border border-border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Common devices</p>
            {DEVICE_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => addPreset(p)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 bg-muted/50 hover:bg-muted text-left text-sm"
              >
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.watts}W · {p.hours_per_day}h/day</span>
              </button>
            ))}
          </div>
        )}

        {devices.length === 0 && !showPresets && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm font-medium">No devices added</p>
            <p className="text-xs text-muted-foreground mt-1">Add a preset or enter a custom device below</p>
          </div>
        )}

        {devices.map((device) => (
          <div key={device.id} className={`rounded-2xl bg-card border border-border p-3 transition-opacity ${!device.enabled ? 'opacity-50' : ''}`}>
            {editingId === device.id ? (
              <div className="space-y-2">
                <input
                  value={device.name}
                  onChange={(e) => updateField(device.id, 'name', e.target.value)}
                  className="w-full rounded-xl border border-border bg-input px-3 py-1.5 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Watts</label>
                    <input type="number" value={device.watts} min="0.1"
                      onChange={(e) => updateField(device.id, 'watts', parseFloat(e.target.value) || 0)}
                      className="w-full mt-0.5 rounded-xl border border-border bg-input px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Hours/day</label>
                    <input type="number" value={device.hours_per_day} min="0" max="24"
                      onChange={(e) => updateField(device.id, 'hours_per_day', Math.min(24, parseFloat(e.target.value) || 0))}
                      className="w-full mt-0.5 rounded-xl border border-border bg-input px-3 py-1.5 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">Done</button>
                  <button onClick={() => deleteDevice(device.id)} className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">Delete</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleDevice(device.id)}
                  className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors ${device.enabled ? 'bg-primary' : 'bg-muted border border-border'}`}
                  aria-label="Toggle device"
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${device.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium truncate">{device.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[device.category]}`}>{device.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {device.watts}W · {device.hours_per_day}h/day · ฿{((device.watts * device.hours_per_day / 1000) * 30 * rateTHB).toFixed(1)}/mo
                  </p>
                </div>
                <button onClick={() => setEditingId(device.id)} className="text-xs text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted flex-shrink-0">
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Custom device form */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Custom Device</p>
        <input
          placeholder="Device name (e.g. Nutrient Dosing Pump)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Watts</label>
            <input type="number" placeholder="e.g. 15" value={newWatts} min="0.1"
              onChange={(e) => setNewWatts(e.target.value)}
              className="w-full mt-0.5 rounded-xl border border-border bg-input px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hours/day</label>
            <input type="number" placeholder="24" value={newHours} min="0" max="24"
              onChange={(e) => setNewHours(e.target.value)}
              className="w-full mt-0.5 rounded-xl border border-border bg-input px-3 py-2 text-sm" />
          </div>
        </div>
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as HydroDevice['category'])}
          className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm">
          <option value="pump">Water Pump</option>
          <option value="airstone">Airstone / Air Pump</option>
          <option value="light">Grow Light</option>
          <option value="fan">Fan</option>
          <option value="heater">Heater / Heat Mat</option>
          <option value="sensor">Sensor / Controller</option>
          <option value="other">Other</option>
        </select>
        <button onClick={addCustom} disabled={!newName.trim() || !newWatts}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40">
          Add Device
        </button>
      </div>

      <div className="rounded-2xl bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium">How this is calculated</p>
        <p>Daily kWh = watts × hours per day ÷ 1000 · Monthly = Daily × 30 · Yearly = Daily × 365</p>
        <p>USD conversion at ฿37 per $1. Adjust the rate above for your actual electricity tariff.</p>
      </div>
    </div>
  );
}
