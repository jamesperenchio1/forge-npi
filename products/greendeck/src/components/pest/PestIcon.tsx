import React from 'react';
import type { IconType } from '@/lib/pest-calendar';

const ICON_COLORS: Record<IconType, { stroke: string; bg: string }> = {
  bug:    { stroke: '#dc2626', bg: '#fef2f2' },
  mite:   { stroke: '#b45309', bg: '#fffbeb' },
  fly:    { stroke: '#7c3aed', bg: '#f5f3ff' },
  aphid:  { stroke: '#15803d', bg: '#f0fdf4' },
  fungus: { stroke: '#92400e', bg: '#fef3c7' },
  scale:  { stroke: '#1d4ed8', bg: '#eff6ff' },
  smoke:  { stroke: '#6b7280', bg: '#f9fafb' },
  blight: { stroke: '#c2410c', bg: '#fff7ed' },
  mold:   { stroke: '#d97706', bg: '#fffbeb' },
};

function BugIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <ellipse cx="12" cy="14" rx="4.5" ry="5.5" />
      <ellipse cx="12" cy="8" rx="2.5" ry="2.5" />
      <path d="M7.5 11L4.5 9M16.5 11L19.5 9M7 15L3.5 14M17 15L20.5 14M7.5 19L5 21M16.5 19L19 21" />
      <path d="M10.5 6.5L9.5 4M13.5 6.5L14.5 4" />
    </svg>
  );
}

function MiteIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-full h-full">
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
      <path d="M5 8L3 6M19 8L21 6M5 16L3 18M19 16L21 18M8 5L6 3M16 5L18 3M8 19L6 21M16 19L18 21" />
    </svg>
  );
}

function FlyIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <ellipse cx="12" cy="14" rx="2.5" ry="3.5" />
      <circle cx="12" cy="9" rx="2" />
      <path d="M9.5 12C7.5 10 3.5 11 4.5 14" />
      <path d="M14.5 12C16.5 10 20.5 11 19.5 14" />
      <path d="M10.5 7.5L9 5.5M13.5 7.5L15 5.5" />
    </svg>
  );
}

function AphidIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-full h-full">
      <circle cx="12" cy="13" r="4.5" />
      <circle cx="10" cy="11.5" r="1" fill={color} stroke="none" />
      <circle cx="14" cy="11.5" r="1" fill={color} stroke="none" />
      <path d="M8.5 10L6 8M15.5 10L18 8M8.5 15L6 17M15.5 15L18 17" />
      <path d="M10 8.5L9 6M14 8.5L15 6" />
    </svg>
  );
}

function FungusIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 3C7 3 4 7 4 10.5C4 13.5 7.5 15 12 15C16.5 15 20 13.5 20 10.5C20 7 17 3 12 3Z" />
      <path d="M12 15V20" />
      <path d="M9 20H15" />
      <path d="M8 10.5C9 9.5 10.5 9 12 9C13.5 9 15 9.5 16 10.5" />
    </svg>
  );
}

function ScaleIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <ellipse cx="12" cy="13" rx="6" ry="4" />
      <ellipse cx="9" cy="10.5" rx="2.5" ry="1.5" />
      <ellipse cx="15" cy="10.5" rx="2.5" ry="1.5" />
      <path d="M12 17V21M9 21H15" />
    </svg>
  );
}

function SmokeIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-full h-full">
      <path d="M4 17C4 17 6 15 8 17C10 19 12 17 14 17C16 17 18 19 20 17" />
      <path d="M4 13C4 13 6 11 8 13C10 15 12 13 14 13C16 13 18 15 20 13" />
      <path d="M7 9C7 9 9 7 11 9C13 11 15 9 17 9" />
    </svg>
  );
}

function BlightIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 3C7 3 4 8 5 13C6 17 9 19 12 20C15 19 18 17 19 13C20 8 17 3 12 3Z" />
      <path d="M9 9L11.5 11.5M15 9L12.5 11.5" />
      <circle cx="12" cy="13" r="2" fill={color} stroke="none" opacity="0.6" />
    </svg>
  );
}

function MoldIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-full h-full">
      <circle cx="9" cy="14" r="3" />
      <circle cx="15" cy="14" r="3" />
      <circle cx="12" cy="9" r="3" />
      <path d="M12 12V20M9 20H15" />
    </svg>
  );
}

const ICONS: Record<IconType, React.FC<{ color: string }>> = {
  bug: BugIcon,
  mite: MiteIcon,
  fly: FlyIcon,
  aphid: AphidIcon,
  fungus: FungusIcon,
  scale: ScaleIcon,
  smoke: SmokeIcon,
  blight: BlightIcon,
  mold: MoldIcon,
};

export function PestIcon({ type, size = 32 }: { type: IconType; size?: number }) {
  const { stroke, bg } = ICON_COLORS[type] ?? { stroke: '#6b7280', bg: '#f9fafb' };
  const IconComponent = ICONS[type];

  return (
    <div
      className="flex-shrink-0 rounded-xl flex items-center justify-center"
      style={{ width: size, height: size, backgroundColor: bg, padding: Math.round(size * 0.14) }}
    >
      <IconComponent color={stroke} />
    </div>
  );
}
