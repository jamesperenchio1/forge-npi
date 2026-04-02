"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function HydroponicsPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [rate, setRate] = useState(4.15);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: devData } = await supabase
        .from("hydro_devices")
        .select("*")
        .eq("user_id", user.id);

      const { data: prefData } = await supabase
        .from("user_prefs")
        .select("electricity_rate_thb")
        .eq("user_id", user.id)
        .single();

      if (devData) setDevices(devData);
      if (prefData?.electricity_rate_thb) setRate(prefData.electricity_rate_thb);
      setLoading(false);
    };

    load();
  }, []);

  const totalWatts = devices.filter((d) => d.enabled).reduce((sum, d) => sum + (d.watts * d.hours_per_day / 24), 0);
  const dailyCost = totalWatts * rate / 1000;
  const monthlyCost = dailyCost * 30;

  const handleToggle = async (deviceId: string, newEnabled: boolean) => {
    await supabase.from("hydro_devices").update({ enabled: newEnabled }).eq("id", deviceId);
    setDevices(devices.map((d) => (d.id === deviceId ? { ...d, enabled: newEnabled } : d)));
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Hydroponics</h1>
        <p className="text-sm text-muted-foreground mt-1">Power cost calculator (THB)</p>
      </div>

      {/* Costs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">Daily</p>
          <p className="text-lg font-bold">฿{dailyCost.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">Monthly</p>
          <p className="text-lg font-bold">฿{monthlyCost.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground">Watts</p>
          <p className="text-lg font-bold">{Math.round(totalWatts)}</p>
        </div>
      </div>

      {/* Rate */}
      <div className="space-y-2">
        <label className="text-sm font-semibold">Electricity rate (THB/kWh)</label>
        <Input
          type="number"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
          onBlur={async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("user_prefs")
                .upsert({ user_id: user.id, electricity_rate_thb: rate });
            }
          }}
          step="0.01"
        />
      </div>

      {/* Devices */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Devices</p>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices added</p>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
              <Switch checked={device.enabled} onCheckedChange={(checked) => handleToggle(device.id, checked)} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.watts}W × {device.hours_per_day}h/day</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
