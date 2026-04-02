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
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', hex: '#16a34a' },
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', hex: '#2563eb' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', hex: '#7c3aed' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', hex: '#d97706' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', hex: '#e11d48' },
];

type DivisionType = 'none' | 'half_h' | 'half_v' | 'quarters' | 'thirds_h' | 'thirds_v';
type ContainerSize = 'small' | 'medium' | 'large' | 'xl';

const SIZE_DIMS: Record<ContainerSize, { w: number; h: number }> = {
  small: { w: 16, h: 12 },
  medium: { w: 24, h: 12 },
  large: { w: 24, h: 20 },
  xl: { w: 32, h: 20 },
};

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

// Mini map draggable container
function MiniDraggableContainer({
  container,
  zoneColor,
}: {
  container: Container;
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
    minWidth: '40px',
    minHeight: '28px',
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border-2 flex flex-col items-center justify-center text-[9px] font-medium cursor-grab active:cursor-grabbing select-none overflow-hidden
        ${zoneColor ?? 'bg-green-100 border-green-300'}
      `}
    >
      <span className="truncate px-0.5 text-center leading-tight">{container.name}</span>
    </div>
  );
}

function CanvasDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });
  return (
    <div ref={setNodeRef} className="relative w-full" style={{ height: '160px' }}>
      {children}
    </div>
  );
}

// Expanded container card component
function ContainerCard({
  container,
  plants,
  zones,
  expanded,
  onToggle,
  onDelete,
  onAssignPlant,
  onRemovePlant,
  onAssignZone,
  onApplyDivision,
  onUpdateSectionLabel,
  onAssignSectionPlant,
  onRename,
  onResize,
}: {
  container: Container;
  plants: LocalPlant[];
  zones: Zone[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAssignPlant: (plantId: string) => void;
  onRemovePlant: (plantId: string) => void;
  onAssignZone: (zoneId: string) => void;
  onApplyDivision: (div: DivisionType) => void;
  onUpdateSectionLabel: (sectionId: string, label: string) => void;
  onAssignSectionPlant: (sectionId: string, plantId: string) => void;
  onRename: (name: string) => void;
  onResize: (size: ContainerSize) => void;
}) {
  const [editName, setEditName] = useState(container.name);
  const [currentDiv, setCurrentDiv] = useState<DivisionType>('none');

  const assignedPlantIds = new Set(container.plantIds);
  const unassignedPlants = plants.filter((p) => !assignedPlantIds.has(p.id));

  function getContainerSize(): ContainerSize {
    const { w, h } = container;
    if (w >= 30) return 'xl';
    if (w >= 22 && h >= 18) return 'large';
    if (w >= 22) return 'medium';
    return 'small';
  }

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <button
        className="w-full px-3 py-2.5 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{container.name}</span>
          <span className="text-xs text-muted-foreground">
            {container.plantIds.length}p · {container.sections.length}sec
          </span>
        </div>
        <span className="text-muted-foreground text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Rename */}
          <div className="flex gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-input px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Pot name"
            />
            <button
              onClick={() => onRename(editName)}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
            >
              Rename
            </button>
          </div>

          {/* Size */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Size</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['small', 'medium', 'large', 'xl'] as ContainerSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onResize(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    getContainerSize() === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'
                  }`}
                >
                  {s === 'small' ? 'S (1×1)' : s === 'medium' ? 'M (2×1)' : s === 'large' ? 'L (2×2)' : 'XL (3×2)'}
                </button>
              ))}
            </div>
          </div>

          {/* Zone assignment */}
          {zones.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Zone</p>
              <div className="flex flex-wrap gap-1.5">
                {zones.map((z, i) => (
                  <button
                    key={z.id}
                    onClick={() => onAssignZone(z.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${ZONE_COLORS[i % ZONE_COLORS.length].bg} ${ZONE_COLORS[i % ZONE_COLORS.length].border} ${ZONE_COLORS[i % ZONE_COLORS.length].text} ${container.zone_id === z.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Sections</p>
            <div className="flex gap-1.5 flex-wrap mb-2">
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
                  onClick={() => { onApplyDivision(val); setCurrentDiv(val); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${currentDiv === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {container.sections.map((section) => (
                <div key={section.id} className="flex items-center gap-2">
                  <input
                    value={section.label}
                    onChange={(e) => onUpdateSectionLabel(section.id, e.target.value)}
                    className="w-16 rounded-lg border border-border bg-input px-2 py-1 text-xs outline-none"
                  />
                  <select
                    value={section.plant_id ?? ''}
                    onChange={(e) => { if (e.target.value) onAssignSectionPlant(section.id, e.target.value); }}
                    className="flex-1 rounded-lg border border-border bg-input px-2 py-1 text-xs outline-none"
                  >
                    <option value="">-- assign plant --</option>
                    {plants.map((p) => (
                      <option key={p.id} value={p.id}>{p.cover_emoji ?? '🌿'} {p.common_name} {p.collector_tag ? `(${p.collector_tag})` : ''}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Quick assign */}
          {unassignedPlants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quick Assign</p>
              <div className="space-y-1">
                {unassignedPlants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onAssignPlant(p.id)}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-muted border border-border hover:border-primary/40 transition-colors"
                  >
                    {p.cover_emoji ?? '🌿'} {p.common_name}
                    <span className="text-muted-foreground ml-1.5">{p.collector_tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assigned plants */}
          {container.plantIds.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Assigned Plants</p>
              <div className="space-y-1">
                {container.plantIds.map((pid) => {
                  const plant = plants.find((p) => p.id === pid);
                  return plant ? (
                    <div key={pid} className="flex items-center justify-between text-xs">
                      <span>{plant.cover_emoji ?? '🌿'} {plant.common_name}</span>
                      <button
                        onClick={() => onRemovePlant(pid)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            className="w-full text-xs text-destructive border border-destructive/30 rounded-lg py-1.5"
          >
            Delete pot
          </button>
        </div>
      )}
    </div>
  );
}

export default function GardenPage() {
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newContainerZoneId, setNewContainerZoneId] = useState<string | null>(null);
  const [newContainerName, setNewContainerName] = useState('');
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

  function addContainer(zoneId: string | null) {
    if (!newContainerName.trim()) return;
    const c: Container = {
      id: crypto.randomUUID(),
      name: newContainerName.trim(),
      x: 10 + Math.random() * 30,
      y: 10 + Math.random() * 30,
      w: SIZE_DIMS.medium.w,
      h: SIZE_DIMS.medium.h,
      color: 'bg-green-100 border-green-300',
      plantIds: [],
      zone_id: zoneId ?? undefined,
      sections: [{ id: crypto.randomUUID(), label: 'Main' }],
    };
    saveContainers([...containers, c]);
    setNewContainerName('');
    setNewContainerZoneId(null);
  }

  function deleteContainer(id: string) {
    saveContainers(containers.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
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

  function renameContainer(containerId: string, name: string) {
    if (!name.trim()) return;
    const updated = containers.map((c) => c.id === containerId ? { ...c, name: name.trim() } : c);
    saveContainers(updated);
  }

  function resizeContainer(containerId: string, size: ContainerSize) {
    const dims = SIZE_DIMS[size];
    const updated = containers.map((c) => c.id === containerId ? { ...c, ...dims } : c);
    saveContainers(updated);
  }

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);

    const container = containers.find((c) => c.id === active.id);
    if (!container) return;

    const canvasEl = document.getElementById('garden-mini-canvas');
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

  function getZoneStyle(zoneId?: string) {
    if (!zoneId) return undefined;
    const idx = zones.findIndex((z) => z.id === zoneId);
    if (idx < 0) return undefined;
    return ZONE_COLORS[idx % ZONE_COLORS.length];
  }

  function getZoneColor(zoneId?: string): string {
    const style = getZoneStyle(zoneId);
    return style ? `${style.bg} ${style.border}` : 'bg-green-100 border-green-300';
  }

  // Group containers by zone
  const zoneContainers = (zoneId: string | null) =>
    containers.filter((c) => (zoneId === null ? !c.zone_id : c.zone_id === zoneId));

  const unzonedContainers = zoneContainers(null);

  function renderAddPotForm(forZoneId: string | null) {
    if (newContainerZoneId !== forZoneId) return null;
    return (
      <div className="flex gap-2 mt-2">
        <input
          autoFocus
          value={newContainerName}
          onChange={(e) => setNewContainerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addContainer(forZoneId)}
          placeholder="Pot name (e.g. NFT channel A)"
          className="flex-1 rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={() => addContainer(forZoneId)} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Add</button>
        <button onClick={() => setNewContainerZoneId(undefined as unknown as null)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm">Cancel</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>Garden</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{containers.length} pot{containers.length !== 1 ? 's' : ''} · {zones.length} zone{zones.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setAddingZone(true)}
          className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          + Add Zone
        </button>
      </div>

      {/* Add zone form */}
      {addingZone && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addZone()}
            placeholder="Zone name (e.g. Balcony, Indoors)"
            className="flex-1 rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={addZone} className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Add</button>
          <button onClick={() => setAddingZone(false)} className="px-3 py-2.5 rounded-xl bg-muted border border-border text-sm">Cancel</button>
        </div>
      )}

      {/* Mini canvas bird's-eye view */}
      {containers.length > 0 && (
        <DndContext
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <div className="rounded-2xl bg-card border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Map Overview</p>
            <div
              id="garden-mini-canvas"
              className="relative w-full bg-muted/50 rounded-xl border border-border overflow-hidden"
              style={{ height: '160px' }}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, oklch(0.38 0.12 145) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <CanvasDroppable>
                {containers.map((c) => (
                  <MiniDraggableContainer
                    key={c.id}
                    container={c}
                    zoneColor={getZoneColor(c.zone_id)}
                  />
                ))}
              </CanvasDroppable>
            </div>
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="rounded-lg bg-green-100 border-2 border-green-300 px-2 py-1 text-xs font-medium opacity-90 shadow-lg">
                {containers.find((c) => c.id === activeId)?.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Zone panels */}
      {zones.length > 0 ? (
        <div className="space-y-3">
          {zones.map((zone, zoneIdx) => {
            const zoneStyle = ZONE_COLORS[zoneIdx % ZONE_COLORS.length];
            const zonePots = zoneContainers(zone.id);
            return (
              <div key={zone.id} className="rounded-2xl border border-border overflow-hidden">
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: zone.color + '22' }}
                >
                  <h2 className={`font-semibold text-sm ${zoneStyle.text}`}>{zone.name}</h2>
                  <button
                    onClick={() => { setNewContainerZoneId(zone.id); setNewContainerName(''); }}
                    className={`text-xs font-medium ${zoneStyle.text} opacity-80`}
                  >
                    + Pot
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {renderAddPotForm(zone.id)}
                  {zonePots.length === 0 && newContainerZoneId !== zone.id ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">No pots yet</p>
                  ) : (
                    zonePots.map((c) => (
                      <ContainerCard
                        key={c.id}
                        container={c}
                        plants={plants}
                        zones={zones}
                        expanded={expandedId === c.id}
                        onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        onDelete={() => deleteContainer(c.id)}
                        onAssignPlant={(pid) => assignPlant(c.id, pid)}
                        onRemovePlant={(pid) => removePlantFromContainer(c.id, pid)}
                        onAssignZone={(zid) => assignZone(c.id, zid)}
                        onApplyDivision={(div) => applyDivision(c.id, div)}
                        onUpdateSectionLabel={(sid, label) => updateSectionLabel(c.id, sid, label)}
                        onAssignSectionPlant={(sid, pid) => assignPlant(c.id, pid, sid)}
                        onRename={(name) => renameContainer(c.id, name)}
                        onResize={(size) => resizeContainer(c.id, size)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Unzoned containers */}
          {unzonedContainers.length > 0 && (
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between bg-muted/50">
                <h2 className="font-semibold text-sm text-muted-foreground">Unzoned</h2>
                <button
                  onClick={() => { setNewContainerZoneId('__unzoned__'); setNewContainerName(''); }}
                  className="text-xs font-medium text-muted-foreground"
                >
                  + Pot
                </button>
              </div>
              <div className="p-3 space-y-2">
                {renderAddPotForm('__unzoned__')}
                {unzonedContainers.map((c) => (
                  <ContainerCard
                    key={c.id}
                    container={c}
                    plants={plants}
                    zones={zones}
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    onDelete={() => deleteContainer(c.id)}
                    onAssignPlant={(pid) => assignPlant(c.id, pid)}
                    onRemovePlant={(pid) => removePlantFromContainer(c.id, pid)}
                    onAssignZone={(zid) => assignZone(c.id, zid)}
                    onApplyDivision={(div) => applyDivision(c.id, div)}
                    onUpdateSectionLabel={(sid, label) => updateSectionLabel(c.id, sid, label)}
                    onAssignSectionPlant={(sid, pid) => assignPlant(c.id, pid, sid)}
                    onRename={(name) => renameContainer(c.id, name)}
                    onResize={(size) => resizeContainer(c.id, size)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // No zones — show all containers in a single "Unzoned" section
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between bg-muted/50">
            <h2 className="font-semibold text-sm text-muted-foreground">All Pots</h2>
            <button
              onClick={() => { setNewContainerZoneId('__all__'); setNewContainerName(''); }}
              className="text-xs font-medium text-muted-foreground"
            >
              + Pot
            </button>
          </div>
          <div className="p-3 space-y-2">
            {renderAddPotForm('__all__')}
            {containers.length === 0 && newContainerZoneId !== '__all__' ? (
              <div className="py-6 text-center space-y-2">
                <span className="text-3xl">🪴</span>
                <p className="text-sm text-muted-foreground">Add a zone to organize your pots, or add a pot directly.</p>
              </div>
            ) : (
              containers.map((c) => (
                <ContainerCard
                  key={c.id}
                  container={c}
                  plants={plants}
                  zones={zones}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  onDelete={() => deleteContainer(c.id)}
                  onAssignPlant={(pid) => assignPlant(c.id, pid)}
                  onRemovePlant={(pid) => removePlantFromContainer(c.id, pid)}
                  onAssignZone={(zid) => assignZone(c.id, zid)}
                  onApplyDivision={(div) => applyDivision(c.id, div)}
                  onUpdateSectionLabel={(sid, label) => updateSectionLabel(c.id, sid, label)}
                  onAssignSectionPlant={(sid, pid) => assignPlant(c.id, pid, sid)}
                  onRename={(name) => renameContainer(c.id, name)}
                  onResize={(size) => resizeContainer(c.id, size)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Unplaced plants hint */}
      {plants.filter((p) => !containers.some((c) => c.plantIds.includes(p.id))).length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Not placed on map</p>
          <div className="flex flex-wrap gap-2">
            {plants.filter((p) => !containers.some((c) => c.plantIds.includes(p.id))).map((p) => (
              <span key={p.id} className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs">
                {p.cover_emoji ?? '🌿'} {p.common_name}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">Expand a pot to assign plants to it.</p>
        </div>
      )}
    </div>
  );
}
