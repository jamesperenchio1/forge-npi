"use client";

interface Props {
  arcPercent: number;   // 0–100, sun position along arc
  altitudeDeg: number;  // degrees above horizon
  sunriseLabel: string;
  sunsetLabel: string;
}

export default function SunArc({ arcPercent, altitudeDeg, sunriseLabel, sunsetLabel }: Props) {
  const isAboveHorizon = altitudeDeg > 0;
  const W = 280, H = 110;
  const cx = W / 2, cy = H - 10;
  const rx = 120, ry = 95;

  // Parametric point on ellipse arc (0 = left/sunrise, 1 = right/sunset, 0.5 = noon/top)
  const t = (arcPercent / 100) * Math.PI; // 0 to π
  const sunX = cx - rx * Math.cos(t);
  const sunY = cy - ry * Math.sin(t);

  const arcPath = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;

  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs" aria-label="Sun position arc">
        {/* Horizon line */}
        <line x1={cx - rx - 10} y1={cy} x2={cx + rx + 10} y2={cy}
          stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

        {/* Arc path */}
        <path d={arcPath} fill="none" stroke="currentColor"
          strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4" />

        {/* Sun glow (if above horizon) */}
        {isAboveHorizon && (
          <>
            <circle cx={sunX} cy={sunY} r="18" fill="#FCD34D" opacity="0.15" />
            <circle cx={sunX} cy={sunY} r="11" fill="#FCD34D" opacity="0.3" />
          </>
        )}

        {/* Sun dot */}
        <circle
          cx={sunX} cy={sunY} r="7"
          fill={isAboveHorizon ? "#F59E0B" : "#94A3B8"}
          stroke="white" strokeWidth="2"
        />

        {/* Sunrise label */}
        <text x={cx - rx} y={cy + 16} fontSize="9" fill="currentColor"
          opacity="0.5" textAnchor="middle">{sunriseLabel}</text>

        {/* Sunset label */}
        <text x={cx + rx} y={cy + 16} fontSize="9" fill="currentColor"
          opacity="0.5" textAnchor="middle">{sunsetLabel}</text>

        {/* Altitude label near sun */}
        {isAboveHorizon && (
          <text x={sunX} y={sunY - 12} fontSize="9" fill="#92400E"
            textAnchor="middle" fontWeight="bold">{altitudeDeg}°</text>
        )}
      </svg>
    </div>
  );
}
