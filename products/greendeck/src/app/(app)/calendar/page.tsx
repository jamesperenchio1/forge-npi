'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarEvent, LocalPlant } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EVENT_TYPES: { value: CalendarEvent['type']; label: string; color: string }[] = [
  { value: 'plant',     label: 'Plant',     color: '#22c55e' },
  { value: 'harvest',   label: 'Harvest',   color: '#f59e0b' },
  { value: 'water',     label: 'Water',     color: '#3b82f6' },
  { value: 'fertilize', label: 'Fertilize', color: '#8b5cf6' },
  { value: 'treat',     label: 'Treat',     color: '#ef4444' },
  { value: 'observe',   label: 'Observe',   color: '#6b7280' },
  { value: 'custom',    label: 'Custom',    color: '#14b8a6' },
];

const THAILAND_GROWING_GUIDE = [
  { name: 'Thai Basil',     sow_indoors: [1,2,11,12],       sow_outdoors: [2,3,10,11],      harvest: [4,5,6,7,8,9],         grow: [3,4,5,6,7,8,9,10],         notes: 'Bolts in heat — harvest before flowering' },
  { name: 'Chilli',         sow_indoors: [1,2,3,10,11],     sow_outdoors: [3,4,10],         harvest: [5,6,7,8,9,10],        grow: [4,5,6,7,8,9,10],           notes: 'Start indoors 8 weeks before transplant' },
  { name: 'Cherry Tomato',  sow_indoors: [9,10,11],         sow_outdoors: [10,11,12],       harvest: [1,2,3,4],             grow: [11,12,1,2,3,4],            notes: 'Cool season crop. Avoid monsoon months.' },
  { name: 'Morning Glory',  sow_indoors: [],                sow_outdoors: [4,5,6,7,8,9],   harvest: [5,6,7,8,9,10],        grow: [4,5,6,7,8,9,10],           notes: 'Direct sow only. Loves heat and rain.' },
  { name: 'Lemongrass',     sow_indoors: [],                sow_outdoors: [4,5,6,7,8,9],   harvest: [6,7,8,9,10,11,12],    grow: [4,5,6,7,8,9,10,11],        notes: 'Propagate by division. Harvest outer stalks.' },
  { name: 'Kaffir Lime',    sow_indoors: [],                sow_outdoors: [4,5,6,7],        harvest: [1,2,3,4,5,6,7,8,9,10,11,12], grow: [3,4,5,6,7,8,9,10,11], notes: 'Leaves year-round once established.' },
  { name: 'Galangal',       sow_indoors: [],                sow_outdoors: [4,5,6,7],        harvest: [10,11,12,1,2],        grow: [4,5,6,7,8,9,10,11],        notes: 'Plant rhizomes at rainy season start.' },
  { name: 'Long Bean',      sow_indoors: [],                sow_outdoors: [4,5,6,7,8,9],   harvest: [5,6,7,8,9,10,11],     grow: [4,5,6,7,8,9,10,11],        notes: 'Fast-growing. Two crops per year.' },
  { name: 'Thai Eggplant',  sow_indoors: [1,2,3,10,11],    sow_outdoors: [3,4,10],         harvest: [5,6,7,8,9,10],        grow: [4,5,6,7,8,9,10],           notes: 'Cool season start, warm harvest.' },
  { name: 'Sweet Potato',   sow_indoors: [],                sow_outdoors: [5,6,7,8],        harvest: [8,9,10,11],           grow: [5,6,7,8,9,10,11],          notes: 'Plant slips. Loves monsoon rain.' },
  { name: 'Cucumber',       sow_indoors: [1,2,10,11],       sow_outdoors: [2,3,10,11],      harvest: [3,4,5,11,12],         grow: [2,3,4,5,11,12,1],          notes: 'Avoid wet season — fungal issues.' },
  { name: 'Pumpkin/Gourd',  sow_indoors: [1,2,11,12],       sow_outdoors: [2,3,11,12],      harvest: [4,5,6,1,2,3],         grow: [2,3,4,5,6,11,12,1],        notes: 'Cool season squash. Needs space.' },
  { name: 'Roselle',        sow_indoors: [4,5,6],           sow_outdoors: [5,6,7],          harvest: [9,10,11],             grow: [5,6,7,8,9,10,11],          notes: 'Harvest calyxes after monsoon.' },
  { name: 'Pandan',         sow_indoors: [],                sow_outdoors: [4,5,6,7,8,9],   harvest: [1,2,3,4,5,6,7,8,9,10,11,12], grow: [3,4,5,6,7,8,9,10,11,12], notes: 'Once established, harvest year-round.' },
  { name: 'Turmeric',       sow_indoors: [],                sow_outdoors: [4,5,6,7],        harvest: [11,12,1,2],           grow: [4,5,6,7,8,9,10,11],        notes: 'Plant rhizomes. Needs rich soil.' },
  { name: 'Bitter Melon',   sow_indoors: [],                sow_outdoors: [3,4,5,8,9],      harvest: [5,6,7,8,9,10,11],     grow: [3,4,5,6,7,8,9,10,11],      notes: 'Needs trellis. Popular in Thai cooking.' },
  { name: 'Water Spinach',  sow_indoors: [],                sow_outdoors: [4,5,6,7,8,9,10], harvest: [5,6,7,8,9,10,11],    grow: [4,5,6,7,8,9,10,11],        notes: 'Rapid grower. Needs constant moisture.' },
  { name: 'Holy Basil',     sow_indoors: [1,2,11,12],       sow_outdoors: [2,3,4,9,10,11],  harvest: [4,5,6,7,8,9],        grow: [3,4,5,6,7,8,9,10],         notes: 'Sacred in Thai cooking. Harvest leaves young.' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function loadEvents(): CalendarEvent[] {
  try {
    return JSON.parse(localStorage.getItem('greendeck_calendar') ?? '[]');
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem('greendeck_calendar', JSON.stringify(events));
}

function loadPlants(): LocalPlant[] {
  try {
    return JSON.parse(localStorage.getItem('greendeck_plants') ?? '[]');
  } catch {
    return [];
  }
}

function getTypeInfo(type: CalendarEvent['type']) {
  return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
}

// ---------------------------------------------------------------------------
// Growing Guide tab
// ---------------------------------------------------------------------------

function GrowingGuideTab({
  events,
  setEvents,
}: {
  events: CalendarEvent[];
  setEvents: (e: CalendarEvent[]) => void;
}) {
  const currentMonth = new Date().getMonth() + 1;

  function addPlantEvent(plantName: string, notes: string) {
    const today = toYMD(new Date());
    const newEv: CalendarEvent = {
      id: crypto.randomUUID(),
      date: today,
      type: 'plant',
      plant_name: plantName,
      notes,
      color: EVENT_TYPES.find((t) => t.value === 'plant')?.color,
    };
    const updated = [...events, newEv];
    setEvents(updated);
    saveEvents(updated);
  }

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
          Sow Indoors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500 flex-shrink-0" />
          Sow Outdoors
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
          Harvest Window
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-400 flex-shrink-0" />
          Best Growing Season
        </span>
      </div>

      {/* Gantt table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="border-collapse text-xs" style={{ minWidth: 600 }}>
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {/* sticky plant name header */}
              <th
                className="sticky left-0 z-10 bg-muted/80 text-left px-3 py-2 font-semibold text-muted-foreground border-r border-border whitespace-nowrap"
                style={{ minWidth: 130 }}
              >
                Plant
              </th>
              {MONTHS.map((m, i) => {
                const monthNum = i + 1;
                const isCurrent = monthNum === currentMonth;
                return (
                  <th
                    key={m}
                    className={`py-2 font-semibold text-center border-r border-border last:border-r-0 ${
                      isCurrent ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                    style={{ width: 36, minWidth: 36 }}
                  >
                    {m}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {THAILAND_GROWING_GUIDE.map((plant, rowIdx) => (
              <tr
                key={plant.name}
                className={`border-b border-border last:border-b-0 transition-colors hover:bg-muted/30 ${
                  rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                {/* sticky plant name cell */}
                <td
                  className="sticky left-0 z-10 px-3 py-1.5 font-medium border-r border-border whitespace-nowrap"
                  style={{
                    backgroundColor: rowIdx % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted) / 0.1)',
                  }}
                >
                  {plant.name}
                </td>
                {MONTHS.map((_, i) => {
                  const monthNum = i + 1;
                  const isCurrent = monthNum === currentMonth;
                  const isSowIndoors = plant.sow_indoors.includes(monthNum);
                  const isSowOutdoors = plant.sow_outdoors.includes(monthNum);
                  const isHarvest = plant.harvest.includes(monthNum);
                  const isGrow = plant.grow.includes(monthNum);

                  const bars: string[] = [];
                  if (isSowIndoors) bars.push('bg-blue-500');
                  if (isSowOutdoors) bars.push('bg-green-500');
                  if (isHarvest) bars.push('bg-amber-400');
                  if (isGrow) bars.push('bg-teal-400');

                  return (
                    <td
                      key={i}
                      className={`border-r border-border last:border-r-0 p-0.5 align-middle ${
                        isCurrent ? 'bg-primary/5' : ''
                      }`}
                      style={{ width: 36, height: 32 }}
                    >
                      {bars.length > 0 && (
                        <div className="flex flex-col gap-0.5 items-center justify-center h-full py-0.5">
                          {bars.map((cls, bi) => (
                            <span
                              key={bi}
                              className={`${cls} rounded-sm`}
                              style={{ width: 22, height: bars.length === 1 ? 14 : 7 }}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-plant Add Event buttons */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Add to Events
        </h2>
        <div className="space-y-1.5">
          {THAILAND_GROWING_GUIDE.map((plant) => (
            <div
              key={plant.name}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{plant.name}</p>
                <p className="text-xs text-muted-foreground truncate">{plant.notes}</p>
              </div>
              <button
                onClick={() => addPlantEvent(plant.name, plant.notes)}
                className="flex-shrink-0 text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10 transition-colors"
              >
                + Add Event
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events tab
// ---------------------------------------------------------------------------

function EventsTab({
  events,
  setEvents,
  plants,
}: {
  events: CalendarEvent[];
  setEvents: (e: CalendarEvent[]) => void;
  plants: LocalPlant[];
}) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<CalendarEvent['type']>('water');
  const [formPlantId, setFormPlantId] = useState('');
  const [formPlantName, setFormPlantName] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  }

  const selectedDateStr = selected ? toYMD(selected) : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] ?? []) : [];

  const upcoming: CalendarEvent[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const ymd = toYMD(d);
    if (eventsByDate[ymd]) upcoming.push(...eventsByDate[ymd]);
  }

  function openDay(day: Date) {
    setSelected(day);
    setSheetOpen(true);
    setAddFormOpen(false);
    setFormDate(toYMD(day));
  }

  function openAddForm() {
    setFormDate(selectedDateStr ?? toYMD(new Date()));
    setFormType('water');
    setFormPlantId('');
    setFormPlantName('');
    setFormNotes('');
    setAddFormOpen(true);
  }

  function handlePlantSelect(id: string) {
    setFormPlantId(id);
    if (id) {
      const p = plants.find((pl) => pl.id === id);
      setFormPlantName(p ? `${p.common_name}${p.collector_tag ? ' (' + p.collector_tag + ')' : ''}` : '');
    } else {
      setFormPlantName('');
    }
  }

  function handleSaveEvent() {
    if (!formPlantName.trim() && !formPlantId) return;
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      date: formDate,
      type: formType,
      plant_id: formPlantId || undefined,
      plant_name: formPlantName.trim() || plants.find((p) => p.id === formPlantId)?.common_name || 'Unknown plant',
      notes: formNotes.trim() || undefined,
      color: EVENT_TYPES.find((t) => t.value === formType)?.color,
    };
    const updated = [...events, newEvent];
    setEvents(updated);
    saveEvents(updated);
    setAddFormOpen(false);
  }

  function deleteEvent(id: string) {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveEvents(updated);
  }

  function DayContent({ date }: { date: Date }) {
    const ymd = toYMD(date);
    const dayEvents = eventsByDate[ymd] ?? [];
    const dots = dayEvents.slice(0, 3);
    return (
      <div className="flex flex-col items-center">
        <span>{date.getDate()}</span>
        {dots.length > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {dots.map((ev, i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: getTypeInfo(ev.type).color }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* DayPicker */}
      <div className="rounded-2xl bg-card border border-border p-4 overflow-x-auto greendeck-calendar">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(day) => day && openDay(day)}
          components={{
            DayButton: ({ day, ...props }) => (
              <button {...props}>
                <DayContent date={day.date} />
              </button>
            ),
          }}
        />
      </div>

      <style>{`
        .greendeck-calendar .rdp-root {
          --rdp-accent-color: #16a34a;
          --rdp-accent-background-color: #dcfce7;
          width: 100%;
        }
        .greendeck-calendar .rdp-month {
          width: 100%;
        }
        .greendeck-calendar .rdp-month_grid {
          width: 100%;
        }
        .greendeck-calendar .rdp-day_button {
          width: 100%;
          height: 2.5rem;
        }
      `}</style>

      {/* Day Sheet */}
      {sheetOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheetOpen(false)}>
          <div
            className="w-full max-w-lg mx-auto bg-background rounded-t-2xl border-t border-border p-5 space-y-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selected.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                x
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((ev) => {
                  const info = getTypeInfo(ev.type);
                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
                    >
                      <span
                        className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: info.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{ev.plant_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{info.label}</p>
                        {ev.notes && <p className="text-xs mt-1">{ev.notes}</p>}
                      </div>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none flex-shrink-0"
                        aria-label="Delete event"
                      >
                        x
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!addFormOpen ? (
              <button
                onClick={openAddForm}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                + Add Event
              </button>
            ) : (
              <div className="space-y-3 rounded-2xl bg-muted/50 border border-border p-4">
                <p className="text-sm font-semibold">New Event</p>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CalendarEvent['type'])}
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plant</label>
                  {plants.length > 0 ? (
                    <select
                      value={formPlantId}
                      onChange={(e) => handlePlantSelect(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— Enter manually —</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.common_name}
                          {p.collector_tag ? ` (${p.collector_tag})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {!formPlantId && (
                    <input
                      value={formPlantName}
                      onChange={(e) => setFormPlantName(e.target.value)}
                      placeholder="Plant name"
                      className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Any extra details..."
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAddFormOpen(false)}
                    className="flex-1 rounded-xl border border-border bg-muted py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    disabled={!formPlantName.trim() && !formPlantId}
                    className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming 7 days */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Upcoming (7 days)
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-5 text-center text-sm text-muted-foreground">
            No events in the next 7 days. Tap a day to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev) => {
              const info = getTypeInfo(ev.type);
              const evDate = new Date(ev.date + 'T00:00:00');
              const isToday = toYMD(evDate) === toYMD(today);
              const isTomorrow =
                toYMD(evDate) ===
                toYMD(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
              const label = isToday
                ? 'Today'
                : isTomorrow
                ? 'Tomorrow'
                : evDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div
                  key={ev.id}
                  className="rounded-xl bg-card border border-border p-3 flex items-center gap-3"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${info.color}22` }}
                  >
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: info.color }}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ev.plant_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {label} · {info.label}
                    </p>
                    {ev.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none flex-shrink-0"
                    aria-label="Delete"
                  >
                    x
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Tab = 'guide' | 'events';

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plants, setPlants] = useState<LocalPlant[]>([]);

  useEffect(() => {
    setEvents(loadEvents());
    setPlants(loadPlants());
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Plant care schedule</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeTab === 'guide'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Growing Guide
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeTab === 'events'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Events
          {events.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5">
              {events.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'guide' ? (
        <GrowingGuideTab events={events} setEvents={setEvents} />
      ) : (
        <EventsTab events={events} setEvents={setEvents} plants={plants} />
      )}
    </div>
  );
}
