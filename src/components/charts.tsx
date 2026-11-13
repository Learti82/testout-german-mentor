"use client";

// Minimal, dependency-free SVG charts that use the theme tokens.

export function BarChart({ data, height = 140, format = (v: number) => String(v), tone = "var(--accent)" }: { data: { label: string; value: number }[]; height?: number; format?: (v: number) => string; tone?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 18);
          return (
            <g key={i}>
              <rect x={i * w + w * 0.18} y={height - h - 2} width={w * 0.64} height={Math.max(h, d.value ? 1.5 : 0)} rx={1.2} fill={tone} opacity={i === data.length - 1 ? 1 : 0.55}>
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </rect>
            </g>
          );
        })}
        <line x1="0" x2="100" y1={height - 1} y2={height - 1} stroke="var(--border)" strokeWidth="0.5" />
      </svg>
      <div className="mt-1 flex text-[10px] text-muted">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center tabular-nums">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, height = 140, max = 1, format = (v: number) => `${Math.round(v * 100)}%` }: { data: { label: string; value: number | null }[]; height?: number; max?: number; format?: (v: number) => string }) {
  const pts = data.map((d, i) => ({ x: data.length === 1 ? 50 : (i / (data.length - 1)) * 96 + 2, y: d.value === null ? null : height - 6 - (d.value / max) * (height - 14), d }));
  const segs: string[] = [];
  let cur = "";
  for (const p of pts) {
    if (p.y === null) {
      if (cur) segs.push(cur);
      cur = "";
      continue;
    }
    cur += `${cur ? "L" : "M"}${p.x},${p.y} `;
  }
  if (cur) segs.push(cur);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2="100" y1={height - 6 - g * (height - 14)} y2={height - 6 - g * (height - 14)} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="1 1" />
        ))}
        {segs.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        ))}
        {pts.map((p, i) =>
          p.y === null ? null : (
            <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="var(--accent)">
              <title>{`${p.d.label}: ${format(p.d.value!)}`}</title>
            </circle>
          ),
        )}
      </svg>
      <div className="mt-1 flex text-[10px] text-muted">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center tabular-nums">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
