'use client';

import { useEffect, useState, useCallback } from 'react';
import { LocalPlant, Container, Zone, PotSection } from '@/types/index';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const ZONE_COLORS = [
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', hex: '#dcfce7' },
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', hex: '#dbeafe' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', hex: '#ede9fe' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', hex: '#fef3c7' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', hex: '#ffe4e6' },
];

type DivisionType = 'none' | 'half_h' | 'half_v' | 'quarters' | 'thirds_h' | 'thirds_v';

function buildSections(division: DivisionType): PotSection[] {
  switch (division) {
    case 'half_h': return [
      { id: crypto.randomUUID(), label: 'Top' },
      { id: crypto.randomUUID(), label: 'Bottom' },
    ];
    case 'half_v': return [
      { id: crypto.randomUUID(), label: 'Left' },
      { id: crypto.randomUUID(), label: 'Right' },
    ];
    case 'quarters': return [
      { id: crypto.randomUUID(), label: 'TL' },
      { id: crypto.randomUUID(), label: 'TR' },
      { id: crypto.randomUUID(), label: 'BL' },
      { id: crypto.randomUUID(), label: 'BR' },
    ];
    case 'thirds_h': return [
      { id: crypto.randomUUID(), label: 'Top' },
      { id: crypto.randomUUID(), label: 'Middle' },
      { id: crypto.randomUUID(), label: 'Bottom' },
    ];
    case 'thirds_v': return [
      { id: crypto.randomUUID(), label: 'Left' },
      { id: crypto.randomUUID(), label: 'Center' },
      { id: crypto.randomUUID(), label: 'Right' },
    ];
    default: return [{ id: crypto.randomUUID(), label: 'Main' }];
  }
}

function DraggableContainer({
  container,
  selected,
  onSelect,
  zoneColor,
}: {
  container: Container;
  selected: boolean;
  onSelect: () => void;
  zoneColor?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: container.id,
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${container.x}%`,
    top: `${container.y}%`,
    width: `${container.w}%`,
    height: `${container.h}%`,
    minWidth: '64px',
    minHeight: '52px',
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : selected ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`rounded-xl border-2 flex flex-col items-center justify-center text-xs font-medium cursor-grab active:cursor-grabbing transition-all select-none
        ${zoneColor ?? 'bg-green-100 border-green-300'}
        ${selected ? 'ring-2 ring-primary ring-offset-1' : ''}
      `}
    >
      <span className="truncate px-1 text-center leading-tight">{container.name}</span>
      {container.plantIds.length > 0 && (
        <span className="text-[10px] opacity-70">{container.plantIds.length}p</span>
      )}
      {container.sections.length > 1 && (
        <span className="text-[9px] opacity-50">{container.sections.length}sec</span>
      )}
    </div>
  );
}

function CanvasDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });
  return (
    <div ref={setNodeRef} className="relative w-full" style={{ height: '380px' }}>
      {children}
    </div>
  );
}

export default function GardenPage() {
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingZone, setAddingZone] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [division, setDivision] = useState<DivisionType>('none');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const p = localStorage.getItem('greendeck_plants');
    if (p) setPlants(JSON.parse(p));
    const c = localStorage.getItem('greendeck_garden');
    if (c) setContainers(JSON.parse(c));
    const z = localStorage.getItem('greendeck_zones');
    if (z) setZones(JSON.parse(z));
  }, []);

  function saveContainers(updated: Container[]) {
    setContainers(updated);
    localStorage.setItem('greendeck_garden', JSON.stringify(updated));
  }

  function saveZones(updated: Zone[]) {
    setZones(updated);
    localStorage.setItem('greendeck_zones', JSON.stringify(updated));
  }

  function addContainer() {
    if (!newName.trim()) return;
    const c: Container = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      x: 10 + Math.random() * 40,
      y: 10 + Math.random() * 40,
      w: 22,
      h: 16,
      color: 'bg-green-100 border-green-300',
      plantIds: [],
      sections: [{ id: crypto.randomUUID(), label: 'Main' }],
    };
    saveContainers([...containers, c]);
    setNewName('');
    setAdding(false);
  }

  function addZone() {
    if (!newZoneName.trim()) return;
    const z: Zone = {
      id: crypto.randomUUID(),
      name: newZoneName.trim(),
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length].hex,
    };
    saveZones([...zones, z]);
    setNewZoneName('');
    setAddingZone(false);
  }

  function deleteContainer(id: string) {
    saveContainers(containers.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  }

  function assignPlant(containerId: string, plantId: string, sectionId?: string) {
    const updated = containers.map((c) => {
      if (c.id !== containerId) return c;
      const newPlantIds = c.plantIds.includes(plantId) ? c.plantIds : [...c.plantIds, plantId];
      const newSections = sectionId
        ? c.sections.map((s) => s.id === sectionId ? { ...s, plant_id: plantId } : s)
        : c.sections;
      return { ...c, plantIds: newPlantIds, sections: newSections };
    });
    saveContainers(updated);
  }

  function removePlantFromContainer(containerId: string, plantId: string) {
    const updated = containers.map((c) => {
      if (c.id !== containerId) return c;
      return {
        ...c,
        plantIds: c.plantIds.filter((id) => id !== plantId),
        sections: c.sections.map((s) => s.plant_id === plantId ? { ...s, plant_id: undefined } : s),
      };
    });
    saveContainers(updated);
  }

  function applyDivision(containerId: string, div: DivisionType) {
    const updated = containers.map((c) => {
      if (c.id !== containerId) return c;
      return { ...c, sections: buildSections(div) };
    });
    saveContainers(updated);
    setDivision(div);
  }

  function assignZone(containerId: string, zoneId: string) {
    const updated = containers.map((c) =>
      c.id === containerId ? { ...c, zone_id: zoneId } : c
    );
    saveContainers(updated);
  }

  function updateSectionLabel(containerId: string, sectionId: string, label: string) {
    const updated = containers.map((c) => {
      if (c.id !== containerId) return c;
      return { ...c, sections: c.sections.map((s) => s.id === sectionId ? { ...s, label } : s) };
    });
    saveContainers(updated);
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);

    const container = containers.find((c) => c.id === active.id);
    if (!container) return;

    const canvasEl = document.getElementById('garden-canvas');
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const dx = (delta.x / rect.width) * 100;
    const dy = (delta.y / rect.height) * 100;

    const newX = Math.max(0, Math.min(100 - container.w, container.x + dx));
    const newY = Math.max(0, Math.min(100 - container.h, container.y + dy));

    const updated = containers.map((c) =>
      c.id === active.id ? { ...c, x: newX, y: newY } : c
    );
    saveContainers(updated);
  }, [containers]);

  const selectedContainer = containers.find((c) => c.id === selected);
  const unplacedPlants = plants.filter(
    (p) => !containers.some((c) => c.plantIds.includes(p.id))
  );

  function getZoneStyle(zoneId?: string) {
    if (!zoneId) return undefined;
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return undefined;
    const idx = zones.indexOf(zone);
    return ZONE_COLORS[idx % ZONE_COLORS.length];
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>Garden Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{containers.length} container{containers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          + Container
        </button>
      </div>

      {/* Zones bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zones</p>
          <button onClick={() => setAddingZone(true)} className="text-xs text-primary font-medium">+ Add zone</button>
        </div>
        {zones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {zones.map((z, i) => (
              <span
                key={z.id}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ZONE_COLORS[i % ZONE_COLORS.length].bg} ${ZONE_COLORS[i % ZONE_COLORS.length].border} ${ZONE_COLORS[i % ZONE_COLORS.length].text}`}
              >
                {z.name}
              </span>
            ))}
          </div>
        )}
        {addingZone && (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addZone()}
              placeholder="Zone name (e.g. Balcony, Indoors)"
              className="flex-1 rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={addZone} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Add</button>
            <button onClick={() => setAddingZone(false)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* Add container form */}
      {adding && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-semibold">New container</p>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addContainer()}
            placeholder="e.g. Balcony shelf #1, NFT channel A"
            className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <button onClick={addContainer} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-sm font-semibold">Add</button>
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl bg-muted border border-border py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Garden canvas with DnD */}
      {containers.length > 0 ? (
        <DndContext
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div
            id="garden-canvas"
            className="relative w-full bg-muted/50 rounded-2xl border border-border overflow-hidden"
            style={{ height: '380px' }}
            onClick={() => setSelected(null)}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, oklch(0.38 0.12 145) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <CanvasDroppable>
              {containers.map((c) => {
                const zoneStyle = getZoneStyle(c.zone_id);
                const colorClass = zoneStyle
                  ? `${zoneStyle.bg} ${zoneStyle.border}`
                  : 'bg-green-100 border-green-300';
                return (
                  <DraggableContainer
                    key={c.id}
                    container={c}
                    selected={selected === c.id}
                    onSelect={() => setSelected(selected === c.id ? null : c.id)}
                    zoneColor={colorClass}
                  />
                );
              })}
            </CanvasDroppable>
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="rounded-xl bg-green-100 border-2 border-green-300 px-3 py-2 text-xs font-medium opacity-90 shadow-lg">
                {containers.find((c) => c.id === activeId)?.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl bg-muted/50 border border-dashed border-border">
          <span className="text-4xl">🗺️</span>
          <p className="text-sm text-muted-foreground">Add a container to start mapping your garden</p>
        </div>
      )}

      {/* Selected container detail */}
      {selectedContainer && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{selectedContainer.name}</p>
            <button
              onClick={() => deleteContainer(selectedContainer.id)}
              className="text-destructive text-xs border border-destructive/30 px-2.5 py-1 rounded-lg"
            >
              Delete
            </button>
          </div>

          {/* Zone assignment */}
          {zones.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Zone</p>
              <div className="flex flex-wrap gap-2">
                {zones.map((z, i) => (
                  <button
                    key={z.id}
                    onClick={() => assignZone(selectedContainer.id, z.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${ZONE_COLORS[i % ZONE_COLORS.length].bg} ${ZONE_COLORS[i % ZONE_COLORS.length].border} ${ZONE_COLORS[i % ZONE_COLORS.length].text} ${selectedContainer.zone_id === z.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pot divisions */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sections</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {([
                { val: 'none', label: 'None' },
                { val: 'half_v', label: '÷2 |' },
                { val: 'half_h', label: '÷2 —' },
                { val: 'quarters', label: '÷4 ⊞' },
                { val: 'thirds_v', label: '÷3 |||' },
                { val: 'thirds_h', label: '÷3 ===' },
              ] as { val: DivisionType; label: string }[]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => applyDivision(selectedContainer.id, val)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${division === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedContainer.sections.length > 0 && (
              <div className="space-y-2">
                {selectedContainer.sections.map((section) => {
                  const assignedPlant = plants.find((p) => p.id === section.plant_id);
                  return (
                    <div key={section.id} className="flex items-center gap-2">
                      <input
                        value={section.label}
                        onChange={(e) => updateSectionLabel(selectedContainer.id, section.id, e.target.value)}
                        className="w-20 rounded-lg border border-border bg-input px-2 py-1 text-xs outline-none"
                      />
                      <select
                        value={section.plant_id ?? ''}
                        onChange={(e) => {
                          if (e.target.value) assignPlant(selectedContainer.id, e.target.value, section.id);
                        }}
                        className="flex-1 rounded-lg border border-border bg-input px-2 py-1 text-xs outline-none"
                      >
                        <option value="">-- assign plant --</option>
                        {plants.map((p) => (
                          <option key={p.id} value={p.id}>{p.cover_emoji ?? '🌿'} {p.common_name}</option>
                        ))}
                      </select>
                      {assignedPlant && (
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{assignedPlant.cover_emoji} {assignedPlant.common_name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plants assigned */}
          {selectedContainer.plantIds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plants</p>
              <div className="space-y-2">
                {selectedContainer.plantIds.map((pid) => {
                  const plant = plants.find((p) => p.id === pid);
                  return plant ? (
                    <div key={pid} className="flex items-center justify-between">
                      <span className="text-sm">{plant.cover_emoji ?? '🌿'} {plant.common_name}</span>
                      <button
                        onClick={() => removePlantFromContainer(selectedContainer.id, pid)}
                        className="text-xs text-muted-foreground"
                      >
                        remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Quick assign unplaced plants */}
          {unplacedPlants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assign plant</p>
              <div className="space-y-1.5">
                {unplacedPlants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => assignPlant(selectedContainer.id, p.id)}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl bg-muted border border-border hover:border-primary/40 transition-colors"
                  >
                    {p.cover_emoji ?? '🌿'} {p.common_name}
                    <span className="text-xs text-muted-foreground ml-2">{p.collector_tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unplaced plants */}
      {unplacedPlants.length > 0 && !selectedContainer && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Not placed on map</p>
          <div className="flex flex-wrap gap-2">
            {unplacedPlants.map((p) => (
              <span key={p.id} className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs">
                {p.cover_emoji ?? '🌿'} {p.common_name}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">Tap a container to assign plants to it.</p>
        </div>
      )}
    </div>
  );
}
