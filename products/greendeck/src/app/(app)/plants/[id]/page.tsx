'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LocalPlant, CareLog, DoctorLog } from '@/types/index';
import { getPestsForMonth } from '@/lib/pest-calendar';
import { PestIcon } from '@/components/pest/PestIcon';
import { use } from 'react';

const HEALTH_STYLES: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  watch: 'bg-amber-100 text-amber-800 border-amber-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  dormant: 'bg-slate-100 text-slate-600 border-slate-200',
};

const CARE_ICONS: Record<CareLog['type'], string> = {
  watered: '💧',
  fertilized: '🧪',
  repotted: '🪴',
  pruned: '✂️',
  treated: '💊',
  observation: '👁️',
  harvest: '🌾',
  noted: '📝',
};

const URGENCY_STYLES: Record<string, string> = {
  monitor: 'bg-green-50 border-green-200 text-green-900',
  act_this_week: 'bg-amber-50 border-amber-200 text-amber-900',
  act_today: 'bg-orange-50 border-orange-200 text-orange-900',
  emergency: 'bg-red-50 border-red-200 text-red-900',
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
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
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = url;
  });
}

export default function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [plant, setPlant] = useState<LocalPlant | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LocalPlant>>({});
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [doctorLogs, setDoctorLogs] = useState<DoctorLog[]>([]);
  const [addingLog, setAddingLog] = useState(false);
  const [newLogType, setNewLogType] = useState<CareLog['type']>('watered');
  const [newLogNotes, setNewLogNotes] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('greendeck_plants') ?? '[]') as LocalPlant[];
    const found = stored.find((p) => p.id === id);
    if (found) {
      setPlant(found);
      setEditForm(found);
      setEditPhotos(found.photos ?? []);
    }
    const logs = JSON.parse(localStorage.getItem('greendeck_care_logs') ?? '[]') as CareLog[];
    setCareLogs(logs.filter((l) => l.plant_id === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    const dLogs = JSON.parse(localStorage.getItem('greendeck_doctor_logs') ?? '[]') as DoctorLog[];
    setDoctorLogs(dLogs.filter((l) => l.plant_id === id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [id]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 4 - editPhotos.length;
    const toProcess = files.slice(0, remaining);
    const compressed = await Promise.all(toProcess.map(compressImage));
    setEditPhotos((prev) => [...prev, ...compressed].slice(0, 4));
    e.target.value = '';
  }

  function removeEditPhoto(idx: number) {
    setEditPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function saveEdit() {
    if (!plant) return;
    const stored = JSON.parse(localStorage.getItem('greendeck_plants') ?? '[]') as LocalPlant[];
    const updatedPlant = { ...plant, ...editForm, photos: editPhotos.length > 0 ? editPhotos : undefined };
    const updated = stored.map((p) => p.id === plant.id ? updatedPlant : p);
    localStorage.setItem('greendeck_plants', JSON.stringify(updated));
    setPlant(updatedPlant as LocalPlant);
    setEditMode(false);
  }

  function addCareLog() {
    if (!plant) return;
    const newLog: CareLog = {
      id: crypto.randomUUID(),
      plant_id: plant.id,
      type: newLogType,
      notes: newLogNotes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };
    const allLogs = JSON.parse(localStorage.getItem('greendeck_care_logs') ?? '[]') as CareLog[];
    const updated = [newLog, ...allLogs];
    localStorage.setItem('greendeck_care_logs', JSON.stringify(updated));
    setCareLogs([newLog, ...careLogs]);
    setNewLogNotes('');
    setAddingLog(false);
  }

  function deletePlant() {
    if (!confirm('Delete this plant?')) return;
    const stored = JSON.parse(localStorage.getItem('greendeck_plants') ?? '[]') as LocalPlant[];
    localStorage.setItem('greendeck_plants', JSON.stringify(stored.filter((p) => p.id !== id)));
    router.push('/plants');
  }

  if (!plant) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Plant not found.</p>
      <Link href="/plants" className="text-primary text-sm mt-2 block">Back to collection</Link>
    </div>
  );

  const displayPhotos = editMode ? editPhotos : (plant.photos ?? []);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground text-2xl leading-none mt-1">‹</button>
        <div className="flex-1">
          {editMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={editForm.cover_emoji ?? '🌿'}
                  onChange={(e) => setEditForm((f) => ({ ...f, cover_emoji: e.target.value }))}
                  className="w-14 rounded-xl border border-border bg-input px-2 py-1.5 text-lg text-center"
                />
                <input
                  value={editForm.common_name ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, common_name: e.target.value }))}
                  className="flex-1 rounded-xl border border-border bg-input px-3 py-2 text-sm font-semibold"
                />
              </div>
              <input
                value={editForm.scientific_name ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, scientific_name: e.target.value }))}
                placeholder="Scientific name"
                className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm italic"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-3xl">{plant.cover_emoji ?? '🌿'}</span>
                <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>{plant.common_name}</h1>
              </div>
              {plant.scientific_name && (
                <p className="text-sm text-muted-foreground italic mt-0.5">{plant.scientific_name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{plant.collector_tag}</p>
            </div>
          )}
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <button onClick={saveEdit} className="rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold">Save</button>
            <button onClick={() => { setEditMode(false); setEditForm(plant); setEditPhotos(plant.photos ?? []); }} className="rounded-xl bg-muted border border-border px-3 py-1.5 text-xs">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)} className="rounded-xl bg-muted border border-border px-3 py-1.5 text-xs font-medium">Edit</button>
        )}
      </div>

      {/* Photos */}
      {(displayPhotos.length > 0 || editMode) && (
        <div>
          {editMode && (
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Photos</label>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {displayPhotos.map((src, idx) => (
              <div key={idx} className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`photo ${idx + 1}`} className="w-[80px] h-[80px] object-cover rounded-xl border border-border" />
                {editMode && (
                  <button
                    onClick={() => removeEditPhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center leading-none"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {editMode && editPhotos.length < 4 && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="w-[80px] h-[80px] rounded-xl border border-dashed border-border bg-muted flex items-center justify-center text-xl flex-shrink-0"
                aria-label="Add photo"
              >
                📷
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>
      )}

      {/* Health status */}
      <div className={`rounded-2xl border p-4 ${HEALTH_STYLES[editMode ? (editForm.health_status ?? plant.health_status) : plant.health_status]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Health Status</p>
            {editMode ? (
              <select
                value={editForm.health_status ?? plant.health_status}
                onChange={(e) => setEditForm((f) => ({ ...f, health_status: e.target.value as LocalPlant['health_status'] }))}
                className="mt-1 rounded-xl border border-current/20 bg-white/60 px-2 py-1 text-sm font-semibold capitalize"
              >
                <option value="healthy">Healthy</option>
                <option value="watch">Watch</option>
                <option value="sick">Sick</option>
                <option value="dormant">Dormant</option>
              </select>
            ) : (
              <p className="text-lg font-semibold mt-0.5 capitalize">{plant.health_status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      {editMode ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-3.5">
            <p className="text-xs text-muted-foreground mb-1">Growing System</p>
            <select
              value={editForm.growing_system ?? plant.growing_system}
              onChange={(e) => setEditForm((f) => ({ ...f, growing_system: e.target.value as LocalPlant['growing_system'] }))}
              className="w-full rounded-lg border border-border bg-input px-2 py-1 text-sm"
            >
              <option value="soil">Soil</option>
              <option value="kratky">Kratky</option>
              <option value="nft">NFT</option>
              <option value="dwc">DWC</option>
              <option value="semi_hydro">Semi-Hydro</option>
            </select>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3.5">
            <p className="text-xs text-muted-foreground mb-1">Stage</p>
            <select
              value={editForm.stage ?? plant.stage}
              onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value as LocalPlant['stage'] }))}
              className="w-full rounded-lg border border-border bg-input px-2 py-1 text-sm"
            >
              <option value="seed">Seed</option>
              <option value="seedling">Seedling</option>
              <option value="juvenile">Juvenile</option>
              <option value="established">Established</option>
              <option value="specimen">Specimen</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Growing System', value: plant.growing_system.toUpperCase().replace('_', '-') },
            { label: 'Stage', value: plant.stage.charAt(0).toUpperCase() + plant.stage.slice(1) },
            { label: 'Added', value: new Date(plant.added_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-card border border-border p-3.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold mt-0.5">{value}</p>
            </div>
          ))}
          <Link href="/doctor" className="rounded-2xl bg-primary/10 border border-primary/30 p-3.5 flex items-center gap-2 hover:bg-primary/20 transition-colors">
            <span className="text-lg">🔬</span>
            <div>
              <p className="text-xs text-primary/80">Plant Doctor</p>
              <p className="text-sm font-semibold text-primary">Diagnose</p>
            </div>
          </Link>
        </div>
      )}

      {/* AI details if available */}
      {plant.gemini_details_fetched && (plant.watering_needs || plant.sunlight_needs || plant.care_level) && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Care Guide</p>
          {plant.watering_needs && (
            <div className="flex gap-2.5">
              <span className="text-lg">💧</span>
              <div><p className="text-xs text-muted-foreground">Watering</p><p className="text-sm">{plant.watering_needs}</p></div>
            </div>
          )}
          {plant.sunlight_needs && (
            <div className="flex gap-2.5">
              <span className="text-lg">☀️</span>
              <div><p className="text-xs text-muted-foreground">Sunlight</p><p className="text-sm">{plant.sunlight_needs}</p></div>
            </div>
          )}
          {plant.care_level && (
            <div className="flex gap-2.5">
              <span className="text-lg">📊</span>
              <div><p className="text-xs text-muted-foreground">Care Level</p><p className="text-sm capitalize">{plant.care_level}</p></div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {editMode ? (
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
          <textarea
            value={editForm.notes ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ) : plant.notes ? (
        <div className="rounded-2xl bg-muted border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{plant.notes}</p>
        </div>
      ) : null}

      {/* Current pest risks */}
      {pests.length > 0 && !editMode && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Watch for this month</p>
          <div className="space-y-2.5">
            {pests.slice(0, 2).map((p) => (
              <div key={p.name} className="flex items-start gap-3">
                <PestIcon type={p.iconType} size={32} />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.signs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Care log section */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Care Log</p>
          <button
            onClick={() => setAddingLog(true)}
            className="text-xs text-primary font-medium"
          >
            + Add Entry
          </button>
        </div>

        {addingLog && (
          <div className="rounded-xl border border-border bg-muted/50 p-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Type</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CARE_ICONS) as [CareLog['type'], string][]).map(([type, icon]) => (
                  <button
                    key={type}
                    onClick={() => setNewLogType(type)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      newLogType === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'
                    }`}
                  >
                    {icon} {type}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={newLogNotes}
              onChange={(e) => setNewLogNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm resize-none outline-none"
            />
            <div className="flex gap-2">
              <button onClick={addCareLog} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-semibold">Save</button>
              <button onClick={() => setAddingLog(false)} className="flex-1 rounded-xl bg-muted border border-border py-2 text-xs">Cancel</button>
            </div>
          </div>
        )}

        {careLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No care entries yet. Add your first entry above.</p>
        ) : (
          <div className="space-y-2.5">
            {careLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{CARE_ICONS[log.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium capitalize">{log.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                      {' '}
                      {new Date(log.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Doctor history */}
      {doctorLogs.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doctor History</p>
          <div className="space-y-2.5">
            {doctorLogs.map((log) => (
              <div key={log.id} className={`rounded-xl border p-3 ${URGENCY_STYLES[log.urgency] ?? 'bg-card border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{log.condition}</p>
                    <p className="text-xs opacity-70 mt-0.5">
                      {new Date(log.timestamp).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })} · {log.severity}
                    </p>
                  </div>
                  {log.resolved && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">Resolved</span>
                  )}
                </div>
                {log.likely_cause && (
                  <p className="text-xs mt-1.5 opacity-80">{log.likely_cause}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      {!editMode && (
        <button
          onClick={deletePlant}
          className="w-full rounded-2xl border border-destructive/30 text-destructive py-3 text-sm font-medium"
        >
          Delete Plant
        </button>
      )}
    </div>
  );
}
