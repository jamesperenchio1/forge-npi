'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocalPlant, PhotoEntry } from '@/types/index';

const EMOJIS = ['🌿', '🪴', '🌵', '🌸', '🌺', '🍃', '🌾', '🎋', '🍀', '🌱', '🌼', '🌻', '🍄', '🪷', '🌴'];

interface AiDetails {
  scientific_name?: string;
  care_level?: string;
  watering?: string;
  sunlight?: string;
  description?: string;
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
        else { width = Math.round((width / height) * MAX); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = url;
  });
}

export default function NewPlantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    common_name: '',
    scientific_name: '',
    collector_tag: '',
    health_status: 'healthy' as LocalPlant['health_status'],
    growing_system: 'soil' as LocalPlant['growing_system'],
    stage: 'established' as LocalPlant['stage'],
    notes: '',
    cover_emoji: '🌿',
  });
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDetails, setAiDetails] = useState<AiDetails | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const compressed = await Promise.all(files.map(compressImage));
    const newEntries: PhotoEntry[] = compressed.map((url) => ({
      url,
      timestamp: new Date().toISOString(),
      comment: '',
    }));
    setPhotos((prev) => [...prev, ...newEntries]);
    e.target.value = '';
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (mainPhotoIndex >= next.length) setMainPhotoIndex(Math.max(0, next.length - 1));
      return next;
    });
  }

  function updateComment(idx: number, comment: string) {
    setPhotos((prev) => prev.map((p, i) => i === idx ? { ...p, comment } : p));
  }

  async function fetchAiDetails(name: string) {
    if (!name.trim() || name.length < 3) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/plant-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAiDetails(json.details);
      setAiExpanded(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }

  function handleNameChange(value: string) {
    update('common_name', value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function acceptAiDetails() {
    if (!aiDetails) return;
    setForm((prev) => ({ ...prev, scientific_name: aiDetails.scientific_name ?? prev.scientific_name }));
    setAiExpanded(false);
  }

  function save() {
    if (!form.common_name.trim()) return;
    setSaving(true);
    const existing: LocalPlant[] = JSON.parse(localStorage.getItem('greendeck_plants') ?? '[]');
    const newPlant: LocalPlant = {
      ...form,
      id: crypto.randomUUID(),
      collector_tag: form.collector_tag || `GD-${String(existing.length + 1).padStart(3, '0')}`,
      added_at: new Date().toISOString(),
      photos: photos.length > 0 ? photos : undefined,
      mainPhotoIndex: photos.length > 0 ? mainPhotoIndex : undefined,
      watering_needs: aiDetails?.watering,
      sunlight_needs: aiDetails?.sunlight,
      care_level: aiDetails?.care_level,
      description: aiDetails?.description,
      gemini_details_fetched: !!aiDetails,
    };
    localStorage.setItem('greendeck_plants', JSON.stringify([...existing, newPlant]));
    router.push('/plants');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground text-2xl leading-none">‹</button>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>New Plant</h1>
      </div>

      {/* Photo upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Photos</label>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="text-xs font-medium text-primary"
          >
            + Add Photo
          </button>
        </div>

        {photos.length > 0 && (
          <div className="space-y-2 mb-2">
            {photos.map((photo, idx) => (
              <div key={idx} className={`rounded-2xl border overflow-hidden ${idx === mainPhotoIndex ? 'border-primary' : 'border-border'}`}>
                <div className="flex gap-3 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(photo.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setMainPhotoIndex(idx)}
                          className={`text-xs px-2 py-0.5 rounded-lg ${idx === mainPhotoIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                          {idx === mainPhotoIndex ? 'Main' : 'Set main'}
                        </button>
                        <button onClick={() => removePhoto(idx)} className="text-xs text-destructive px-1">✕</button>
                      </div>
                    </div>
                    <input
                      value={photo.comment ?? ''}
                      onChange={(e) => updateComment(idx, e.target.value)}
                      placeholder="Add a note about this photo..."
                      className="w-full rounded-xl border border-border bg-input px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <button
            onClick={() => photoInputRef.current?.click()}
            className="w-full h-24 rounded-2xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
              <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            <span className="text-xs">Tap to upload photos of your plant</span>
          </button>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
        <p className="text-xs text-muted-foreground mt-1">No limit · compressed automatically · notes become part of your plant's log</p>
      </div>

      {/* Emoji picker */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon (used when no photo)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => update('cover_emoji', e)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-colors ${
                form.cover_emoji === e ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Common name with AI */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Common name <span className="text-destructive">*</span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              value={form.common_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Monstera Thai Constellation"
              className="flex-1 rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => fetchAiDetails(form.common_name)}
              disabled={!form.common_name.trim() || aiLoading}
              className="flex-shrink-0 rounded-xl border border-primary/40 bg-primary/10 text-primary px-3 py-2.5 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              {aiLoading ? '...' : '✨ AI'}
            </button>
          </div>
        </div>

        {aiDetails && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Details</p>
              <button onClick={() => setAiExpanded(!aiExpanded)} className="text-xs text-primary/70">
                {aiExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            {aiExpanded && (
              <div className="space-y-2 text-sm">
                {aiDetails.scientific_name && <div><span className="text-muted-foreground text-xs">Scientific name: </span><span className="italic">{aiDetails.scientific_name}</span></div>}
                {aiDetails.care_level && <div><span className="text-muted-foreground text-xs">Care level: </span><span className="font-medium capitalize">{aiDetails.care_level}</span></div>}
                {aiDetails.watering && <div><span className="text-muted-foreground text-xs">Watering: </span>{aiDetails.watering}</div>}
                {aiDetails.sunlight && <div><span className="text-muted-foreground text-xs">Sunlight: </span>{aiDetails.sunlight}</div>}
                {aiDetails.description && <p className="text-xs text-muted-foreground">{aiDetails.description}</p>}
                <button onClick={acceptAiDetails} className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-xs font-semibold">
                  Use scientific name suggestion
                </button>
              </div>
            )}
          </div>
        )}

        {aiError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs text-destructive">{aiError}</p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scientific name</label>
          <input
            value={form.scientific_name}
            onChange={(e) => update('scientific_name', e.target.value)}
            placeholder="e.g. Monstera deliciosa 'Thai Constellation'"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm italic outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your label / tag</label>
          <input
            value={form.collector_tag}
            onChange={(e) => update('collector_tag', e.target.value)}
            placeholder="e.g. BKK-001 (auto-generated if blank)"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Health</label>
            <select value={form.health_status} onChange={(e) => update('health_status', e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="sick">Sick</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</label>
            <select value={form.stage} onChange={(e) => update('stage', e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
              <option value="seed">Seed</option>
              <option value="seedling">Seedling</option>
              <option value="juvenile">Juvenile</option>
              <option value="established">Established</option>
              <option value="specimen">Specimen</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Growing System</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['soil', 'kratky', 'nft', 'dwc', 'semi_hydro'] as const).map((sys) => (
              <button key={sys} onClick={() => update('growing_system', sys)}
                className={`rounded-xl border py-2 text-xs font-semibold transition-colors ${
                  form.growing_system === sys ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground'
                }`}>
                {sys === 'semi_hydro' ? 'Semi-Hydro' : sys.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)}
            placeholder="Variegation notes, origin, propagation history..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={!form.common_name.trim() || saving}
        className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        {saving ? 'Saving...' : 'Save Plant'}
      </button>
    </div>
  );
}
