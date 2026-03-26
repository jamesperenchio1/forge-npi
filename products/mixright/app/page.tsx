"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentWeather, isWeatherError, type WeatherData } from "@/lib/weatherApi";
import { calculateMix, type MixInputs, type MixResult } from "@/lib/mixCalculator";
import { APPLICATION_TYPES } from "@/lib/constants";

type Lang = "en" | "th" | "tl" | "id";
type MixClass = "A" | "B" | "C";
type SandType = "river" | "crushed" | "mixed";
type Step = "inputs" | "results";

const T: Record<Lang, Record<string, string>> = {
  en: {
    title: "MixRight",
    tagline: "Concrete mix for TODAY's weather",
    getting_weather: "Reading weather...",
    weather_error: "Can't get weather — enter manually",
    temp: "Temp",
    humidity: "Humidity",
    mix_class: "Mix Class",
    application: "Application",
    sand_type: "Sand Type",
    sand_river: "River sand (smooth)",
    sand_crushed: "Crushed / manufactured (sharp)",
    sand_mixed: "Mixed / not sure",
    cement_age: "Cement bag age",
    fresh: "Fresh (≤1 month)",
    one_month: "1–3 months",
    three_months: "3–6 months",
    old: "6+ months (degraded)",
    num_bags: "Number of bags",
    calculate: "Calculate Mix",
    water_per_bag: "Water per bag",
    total_water: "Total water",
    liters: "L",
    buckets_per_bag: "Buckets per bag (20L bucket)",
    cement_b: "Cement",
    sand_b: "Sand",
    gravel_b: "Gravel",
    one_bag: "1 bag",
    cure_title: "Curing",
    cure_days: "Keep wet for",
    days: "days",
    recalculate: "Recalculate",
    why_adj: "Why adjusted?",
    adj_humidity: "Humidity",
    adj_temp: "Temperature",
    adj_sand: "Sand type",
  },
  th: {
    title: "MixRight",
    tagline: "สูตรผสมคอนกรีตสำหรับสภาพอากาศวันนี้",
    getting_weather: "กำลังอ่านสภาพอากาศ...",
    weather_error: "ไม่สามารถรับข้อมูลอากาศ — กรอกเอง",
    temp: "อุณหภูมิ",
    humidity: "ความชื้น",
    mix_class: "ชั้นคอนกรีต",
    application: "ประเภทงาน",
    sand_type: "ประเภททราย",
    sand_river: "ทรายแม่น้ำ (เนียน)",
    sand_crushed: "ทรายหิน (หยาบ)",
    sand_mixed: "ผสม / ไม่แน่ใจ",
    cement_age: "อายุถุงปูน",
    fresh: "ใหม่ (≤1 เดือน)",
    one_month: "1–3 เดือน",
    three_months: "3–6 เดือน",
    old: "6+ เดือน",
    num_bags: "จำนวนถุง",
    calculate: "คำนวณส่วนผสม",
    water_per_bag: "น้ำต่อถุง",
    total_water: "น้ำรวม",
    liters: "ลิตร",
    buckets_per_bag: "ถังต่อถุง (ถัง 20 ลิตร)",
    cement_b: "ปูน",
    sand_b: "ทราย",
    gravel_b: "หิน",
    one_bag: "1 ถุง",
    cure_title: "การบ่ม",
    cure_days: "รักษาความชื้น",
    days: "วัน",
    recalculate: "คำนวณใหม่",
    why_adj: "ทำไมถึงปรับ?",
    adj_humidity: "ความชื้น",
    adj_temp: "อุณหภูมิ",
    adj_sand: "ประเภททราย",
  },
  tl: {
    title: "MixRight",
    tagline: "Tamang halo ng kongkreto para sa panahon ngayon",
    getting_weather: "Binabasa ang panahon...",
    weather_error: "Hindi makuha ang panahon — ipasok nang manu-mano",
    temp: "Temp",
    humidity: "Halumigmig",
    mix_class: "Klase ng Mix",
    application: "Uri ng Trabaho",
    sand_type: "Uri ng Buhangin",
    sand_river: "Buhangin sa ilog (makinis)",
    sand_crushed: "Dinurog na bato (magaspang)",
    sand_mixed: "Halo / hindi sigurado",
    cement_age: "Edad ng semento",
    fresh: "Bago (≤1 buwan)",
    one_month: "1–3 buwan",
    three_months: "3–6 buwan",
    old: "6+ buwan",
    num_bags: "Bilang ng bag",
    calculate: "Kalkulahin ang Halo",
    water_per_bag: "Tubig bawat bag",
    total_water: "Kabuuang tubig",
    liters: "L",
    buckets_per_bag: "Timba bawat bag (20L timba)",
    cement_b: "Semento",
    sand_b: "Buhangin",
    gravel_b: "Graba",
    one_bag: "1 bag",
    cure_title: "Pagpapatuyo",
    cure_days: "Panatilihing basa sa loob ng",
    days: "araw",
    recalculate: "Kalkulahin Muli",
    why_adj: "Bakit naaayos?",
    adj_humidity: "Halumigmig",
    adj_temp: "Temperatura",
    adj_sand: "Uri ng buhangin",
  },
  id: {
    title: "MixRight",
    tagline: "Campuran beton untuk cuaca hari ini",
    getting_weather: "Membaca cuaca...",
    weather_error: "Tidak bisa ambil cuaca — masukkan manual",
    temp: "Suhu",
    humidity: "Kelembapan",
    mix_class: "Kelas Beton",
    application: "Jenis Pekerjaan",
    sand_type: "Jenis Pasir",
    sand_river: "Pasir sungai (halus)",
    sand_crushed: "Pasir abu batu (kasar)",
    sand_mixed: "Campuran / tidak yakin",
    cement_age: "Usia semen",
    fresh: "Baru (≤1 bulan)",
    one_month: "1–3 bulan",
    three_months: "3–6 bulan",
    old: "6+ bulan",
    num_bags: "Jumlah sak",
    calculate: "Hitung Campuran",
    water_per_bag: "Air per sak",
    total_water: "Total air",
    liters: "L",
    buckets_per_bag: "Ember per sak (ember 20L)",
    cement_b: "Semen",
    sand_b: "Pasir",
    gravel_b: "Kerikil",
    one_bag: "1 sak",
    cure_title: "Perawatan",
    cure_days: "Jaga tetap lembab selama",
    days: "hari",
    recalculate: "Hitung Ulang",
    why_adj: "Mengapa disesuaikan?",
    adj_humidity: "Kelembapan",
    adj_temp: "Suhu",
    adj_sand: "Jenis pasir",
  },
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("inputs");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherErrorMsg, setWeatherErrorMsg] = useState<string | null>(null);
  const [manualTemp, setManualTemp] = useState(32);
  const [manualHumidity, setManualHumidity] = useState(80);
  const [mixClass, setMixClass] = useState<MixClass>("B");
  const [applicationId, setApplicationId] = useState("slab");
  const [sandType, setSandType] = useState<SandType>("river");
  const [cementAge, setCementAge] = useState(0);
  const [numBags, setNumBags] = useState(2);
  const [result, setResult] = useState<MixResult | null>(null);

  const t = T[lang];

  useEffect(() => {
    getCurrentWeather().then((res) => {
      setWeatherLoading(false);
      if (isWeatherError(res)) {
        setWeatherErrorMsg(res.message);
      } else {
        setWeather(res);
      }
    });
  }, []);

  const activeTemp = weather?.temperatureC ?? manualTemp;
  const activeHumidity = weather?.humidityPct ?? manualHumidity;

  function handleCalculate() {
    const inputs: MixInputs = {
      mixClass,
      applicationId,
      sandType,
      cementAgeMonths: cementAge,
      temperatureC: activeTemp,
      humidityPct: activeHumidity,
      numBags,
    };
    setResult(calculateMix(inputs));
    setStep("results");
  }

  const LANGS: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "th", label: "TH" },
    { code: "tl", label: "TL" },
    { code: "id", label: "ID" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
          <p className="text-xs opacity-80 mt-0.5">{t.tagline}</p>
        </div>
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                lang === l.code
                  ? "bg-primary-foreground text-primary"
                  : "opacity-60 hover:opacity-90"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Weather Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t.temp} / {t.humidity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">{t.getting_weather}</p>
            ) : weather ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-primary">{weather.temperatureC}°C</div>
                  <div className="text-xs text-muted-foreground">{t.temp}</div>
                </div>
                <div className="text-3xl text-muted-foreground font-light">|</div>
                <div className="text-center">
                  <div className="text-3xl font-black text-primary">{weather.humidityPct}%</div>
                  <div className="text-xs text-muted-foreground">{t.humidity}</div>
                </div>
                <Badge variant="secondary" className="ml-auto text-xs">GPS</Badge>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{weatherErrorMsg || t.weather_error}</p>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">{t.temp} (°C)</label>
                    <input
                      type="number"
                      value={manualTemp}
                      onChange={(e) => setManualTemp(Number(e.target.value))}
                      className="w-full border border-input rounded-md px-3 py-2 text-lg font-bold text-center bg-background"
                      min={15} max={50}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">{t.humidity} (%)</label>
                    <input
                      type="number"
                      value={manualHumidity}
                      onChange={(e) => setManualHumidity(Number(e.target.value))}
                      className="w-full border border-input rounded-md px-3 py-2 text-lg font-bold text-center bg-background"
                      min={20} max={100}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {step === "inputs" && (
          <>
            {/* Mix Class */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.mix_class}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["A", "B", "C"] as MixClass[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setMixClass(c)}
                      className={`py-3 px-2 rounded-lg font-bold text-sm border-2 transition-all ${
                        mixClass === c
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lang === "en" && mixClass === "A" && "1:1.5:3 — Columns, footings, beams"}
                  {lang === "en" && mixClass === "B" && "1:2:4 — Slabs, walls, general"}
                  {lang === "en" && mixClass === "C" && "1:3:6 — Fence posts, non-structural"}
                  {lang !== "en" && `Class ${mixClass}`}
                </p>
              </CardContent>
            </Card>

            {/* Application */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.application}</p>
                <div className="grid grid-cols-2 gap-2">
                  {APPLICATION_TYPES.map((app) => {
                    const label = lang === "id" ? app.id_text : (app[lang as "en" | "th" | "tl"] ?? app.en);
                    return (
                      <button
                        key={app.id}
                        onClick={() => setApplicationId(app.id)}
                        className={`py-2 px-3 rounded-lg text-sm text-left border-2 transition-all ${
                          applicationId === app.id
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sand + Cement Age + Bags */}
            <Card>
              <CardContent className="pt-4 pb-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.sand_type}</p>
                  <div className="space-y-2">
                    {(["river", "crushed", "mixed"] as SandType[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSandType(s)}
                        className={`w-full py-2 px-4 rounded-lg text-sm text-left border-2 transition-all ${
                          sandType === s
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {s === "river" ? t.sand_river : s === "crushed" ? t.sand_crushed : t.sand_mixed}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.cement_age}</p>
                  <div className="space-y-2">
                    {[
                      { months: 0, label: t.fresh },
                      { months: 2, label: t.one_month },
                      { months: 4, label: t.three_months },
                      { months: 8, label: t.old },
                    ].map(({ months, label }) => (
                      <button
                        key={months}
                        onClick={() => setCementAge(months)}
                        className={`w-full py-2 px-4 rounded-lg text-sm text-left border-2 transition-all ${
                          cementAge === months
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.num_bags}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNumBags(Math.max(1, numBags - 1))}
                      className="w-12 h-12 rounded-lg border-2 border-border text-xl font-bold hover:border-primary transition-colors"
                    >−</button>
                    <span className="text-3xl font-black text-primary flex-1 text-center">{numBags}</span>
                    <button
                      onClick={() => setNumBags(Math.min(50, numBags + 1))}
                      className="w-12 h-12 rounded-lg border-2 border-border text-xl font-bold hover:border-primary transition-colors"
                    >+</button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleCalculate} className="w-full h-14 text-lg font-black" size="lg">
              {t.calculate}
            </Button>
          </>
        )}

        {/* Results */}
        {step === "results" && result && (
          <>
            {result.cementWarning.level !== "ok" && (
              <Card className={`border-2 ${result.cementWarning.level === "danger" ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-50"}`}>
                <CardContent className="pt-4 pb-4">
                  <p className={`text-sm font-semibold ${result.cementWarning.level === "danger" ? "text-destructive" : "text-yellow-700"}`}>
                    ⚠ {(result.cementWarning as Record<string, string>)[lang]}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-primary">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.water_per_bag}</p>
                <div className="text-6xl font-black text-primary mt-1">{result.waterPerBag}</div>
                <div className="text-2xl font-semibold text-muted-foreground">{t.liters}</div>
                {numBags > 1 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t.total_water}: <strong>{result.totalWater}{t.liters}</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t.buckets_per_bag}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted rounded-lg py-3">
                    <div className="text-xl font-black">{t.one_bag}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.cement_b}</div>
                  </div>
                  <div className="bg-muted rounded-lg py-3">
                    <div className="text-xl font-black">{result.bucketsPerBag.sand}×</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.sand_b}</div>
                  </div>
                  <div className="bg-muted rounded-lg py-3">
                    <div className="text-xl font-black">{result.bucketsPerBag.gravel}×</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.gravel_b}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(result.adjustments.humidity !== 0 || result.adjustments.temperature !== 0) && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.why_adj}</p>
                  <div className="space-y-1 text-sm">
                    {result.adjustments.humidity !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.adj_humidity} ({activeHumidity}%)</span>
                        <span className={`font-semibold ${result.adjustments.humidity < 0 ? "text-blue-600" : "text-orange-600"}`}>
                          {result.adjustments.humidity > 0 ? "+" : ""}{result.adjustments.humidity}L
                        </span>
                      </div>
                    )}
                    {result.adjustments.temperature !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.adj_temp} ({activeTemp}°C)</span>
                        <span className={`font-semibold ${result.adjustments.temperature < 0 ? "text-blue-600" : "text-orange-600"}`}>
                          {result.adjustments.temperature > 0 ? "+" : ""}{result.adjustments.temperature}L
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/30">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.cure_title}</p>
                <p className="text-2xl font-black text-primary">
                  {t.cure_days} {result.cureTime.minDays} {t.days}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {(result.cureTime.note as Record<string, string>)[lang]}
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={() => { setStep("inputs"); setResult(null); }}
              variant="outline"
              className="w-full h-12 font-semibold"
            >
              {t.recalculate}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
