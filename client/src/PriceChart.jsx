import React from 'react';

// Plain SVG line chart: bond price against yield shift.
export default function PriceChart({ results }) {
  const W = 560, H = 240, P = { l: 56, r: 16, t: 16, b: 36 };
  const xs = results.map((r) => r.shiftBps);
  const ys = results.map((r) => r.price);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const pad = (yMax - yMin) * 0.1 || 1;
  const sx = (x) => P.l + ((x - xMin) / (xMax - xMin || 1)) * (W - P.l - P.r);
  const sy = (y) => H - P.b - ((y - (yMin - pad)) / (yMax - yMin + 2 * pad)) * (H - P.t - P.b);
  const path = results.map((r, i) => `${i ? 'L' : 'M'}${sx(r.shiftBps)},${sy(r.price)}`).join(' ');
  const base = results.find((r) => r.shiftBps === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bond price versus yield shift" className="chart">
      {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={sy(v)} y2={sy(v)} className="grid" />
          <text x={P.l - 8} y={sy(v) + 4} textAnchor="end" className="tick">{v.toFixed(0)}</text>
        </g>
      ))}
      {results.map((r) => (
        <text key={r.shiftBps} x={sx(r.shiftBps)} y={H - 12} textAnchor="middle" className="tick">
          {r.shiftBps > 0 ? `+${r.shiftBps}` : r.shiftBps}
        </text>
      ))}
      <path d={path} className="line" fill="none" />
      {results.map((r) => (
        <circle key={r.shiftBps} cx={sx(r.shiftBps)} cy={sy(r.price)} r={r === base ? 5 : 3.5}
                className={r === base ? 'dot base' : 'dot'}>
          <title>{`${r.shiftBps} bps: ${r.price.toFixed(2)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
