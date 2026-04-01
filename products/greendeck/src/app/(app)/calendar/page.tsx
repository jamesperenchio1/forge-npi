'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarEvent, LocalPlant } from '@/types';

const EVENT_TYPES: { value: CalendarEvent['type']; label: string; emoji: string; color: string }[] = [
  { value: 'plant', label: 'Plant', emoji: '🌱', color: '#22c55e' },
  { value: 'harvest', label: 'Harvest', emoji: '🌾', color: '#f59e0b' },
  { value: 'water', label: 'Water', emoji: '💧', color: '#3b82f6' },
  { value: 'fertilize', label: 'Fertilize', emoji: '🧪', color: '#8b5cf6' },
  { value: 'treat', label: 'Treat', emoji: '💊', color: '#ef4444' },
  { value: 'observe', label: 'Observe', emoji: '👁️', color: '#6b7280' },
  { value: 'custom', label: 'Custom', emoji: '📝', color: '#14b8a6' },
];

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<CalendarEvent['type']>('water');
  const [formPlantId, setFormPlantId] = useState('');
  const [formPlantName, setFormPlantName] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    setEvents(loadEvents());
    setPlants(loadPlants());
  }, []);

  // Build a map of date → events for dot display
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  }

  const selectedDateStr = selected ? toYMD(selected) : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] ?? []) : [];

  // Upcoming 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

  function saveEvent() {
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

  function getTypeInfo(type: CalendarEvent['type']) {
    return EVENT_TYPES.find((t) => t.value === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1];
  }

  // Custom day renderer with dots
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
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Plant care schedule</p>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-card border border-border p-4 overflow-x-auto greendeck-calendar">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(day) => day && openDay(day)}
          components={{ DayButton: ({ day, ...props }) => (
            <button {...props}>
              <DayContent date={day.date} />
            </button>
          )}}
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
                ×
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
                      <span className="text-xl">{info.emoji}</span>
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
                        ×
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
                        {t.emoji} {t.label}
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
                          {p.cover_emoji ?? '🌿'} {p.common_name}
                          {p.collector_tag ? ` (${p.collector_tag})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {(!formPlantId) && (
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
                    placeholder="Any extra details…"
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
                    onClick={saveEvent}
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
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${info.color}22` }}
                  >
                    {info.emoji}
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
                    ×
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
