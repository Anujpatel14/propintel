'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradientId?: string;
  showGlow?: boolean;
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function AreaChart({
  data,
  height = 280,
  color = '#1d4ed8',
  gradientId = 'chart-gradient',
  showGlow = true,
}: AreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const range = Math.max(maxVal - minVal, 1);

  const padding = { top: 28, right: 16, bottom: 32, left: 52 };
  const graphWidth = 560;
  const graphHeight = height - padding.top - padding.bottom;
  const viewBoxWidth = graphWidth + padding.left + padding.right;

  const points = data.map((d, i) => {
    const x =
      padding.left + (data.length === 1 ? graphWidth / 2 : (i / (data.length - 1)) * graphWidth);
    const normalizedY = (d.value - minVal) / range;
    const y = padding.top + graphHeight - normalizedY * graphHeight;
    return { x, y, ...d };
  });

  const linePath = smoothPath(points);
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`
    : '';

  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const ratio = i / 3;
    const y = padding.top + ratio * graphHeight;
    const val = maxVal - ratio * range;
    return { y, val };
  });

  const glowId = `${gradientId}-glow`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className="h-auto w-full select-none overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="55%" stopColor={color} stopOpacity={0.08} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={padding.left + graphWidth}
              y2={line.y}
              stroke="var(--border-strong)"
              strokeWidth="1"
              strokeDasharray={idx === 3 ? undefined : '4 6'}
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              fill="var(--muted-foreground)"
              fontSize="10"
              fontWeight="500"
              textAnchor="end"
            >
              {line.val >= 1000 ? `$${(line.val / 1000).toFixed(0)}k` : `$${line.val.toFixed(0)}`}
            </text>
          </g>
        ))}

        {points.map(
          (p, idx) =>
            (idx % Math.ceil(data.length / 6) === 0 || idx === data.length - 1) && (
              <text
                key={idx}
                x={p.x}
                y={padding.top + graphHeight + 22}
                fill="var(--muted-foreground)"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                {p.label}
              </text>
            )
        )}

        {areaPath && (
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          />
        )}

        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={showGlow ? `url(#${glowId})` : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
          />
        )}

        {points.map((p, idx) => (
          <g
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <rect
              x={p.x - graphWidth / (data.length * 2)}
              y={padding.top}
              width={graphWidth / Math.max(data.length - 1, 1)}
              height={graphHeight}
              fill="transparent"
              className="cursor-crosshair"
            />
            {hoveredIndex === idx && (
              <>
                <line
                  x1={p.x}
                  y1={padding.top}
                  x2={p.x}
                  y2={padding.top + graphHeight}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity={0.55}
                />
                <circle cx={p.x} cy={p.y} r="8" fill={color} opacity={0.18} />
                <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke={color} strokeWidth="3" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="pointer-events-none absolute z-10 min-w-[120px] rounded-2xl border border-[var(--border)] bg-[#0b1220] px-3.5 py-2.5 text-white shadow-xl"
          style={{
            left: `${Math.min(
              78,
              Math.max(8, ((points[hoveredIndex].x - padding.left) / graphWidth) * 80 + 8)
            )}%`,
            top: '8px',
          }}
        >
          <div className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">
            {points[hoveredIndex].label}
          </div>
          <div className="mt-0.5 text-sm font-bold">
            ${points[hoveredIndex].value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  data: Array<DataPoint & { tone?: 'up' | 'down' | 'flat' }>;
  height?: number;
}

export function BarChart({ data, height = 180 }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const width = 420;
  const chartH = height - padding.top - padding.bottom;
  const gap = 10;
  const barW = (width - padding.left - padding.right - gap * (data.length - 1)) / data.length;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        {data.map((d, i) => {
          const h = Math.max(6, (Math.abs(d.value) / max) * chartH);
          const x = padding.left + i * (barW + gap);
          const y = padding.top + chartH - h;
          const tone = d.tone || (d.value >= 0 ? 'up' : 'down');
          const fill =
            tone === 'up' ? 'url(#barUp)' : tone === 'down' ? 'url(#barDown)' : 'url(#barFlat)';
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <defs>
                <linearGradient id="barUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="barDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
                <linearGradient id="barFlat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={10}
                fill={fill}
                opacity={hovered === null || hovered === i ? 1 : 0.35}
              />
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="10"
                fontWeight="600"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && data[hovered] && (
        <div className="pointer-events-none absolute top-2 right-2 rounded-xl bg-[#0b1220] px-3 py-1.5 text-xs font-bold text-white">
          {data[hovered].value >= 0 ? '+' : ''}
          {data[hovered].value.toLocaleString()}
        </div>
      )}
    </div>
  );
}

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 200,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  size?: number;
}) {
  const total = Math.max(
    slices.reduce((s, x) => s + Math.max(0, x.value), 0),
    1
  );
  const radius = 68;
  const stroke = 22;
  const c = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const portion = slice.value / total;
      const length = circumference * portion;
      const item = {
        ...slice,
        length,
        offset,
        portion,
      };
      offset += length;
      return item;
    });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={stroke}
        />
        {arcs.map((arc, i) => (
          <motion.circle
            key={arc.label}
            cx={c}
            cy={c}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={-arc.offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center text-center">
        <div className="text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">
          {centerLabel}
        </div>
        <div className="mt-0.5 font-display text-xl font-bold tracking-tight text-[#0b1220]">
          {centerValue}
        </div>
      </div>
    </div>
  );
}

/** Two-series line chart (e.g. purchases vs sales) */
export function DualLineChart({
  seriesA,
  seriesB,
  labelA = 'Purchases',
  labelB = 'Sales',
  colorA = '#1d4ed8',
  colorB = '#f59e0b',
  height = 200,
}: {
  seriesA: DataPoint[];
  seriesB: DataPoint[];
  labelA?: string;
  labelB?: string;
  colorA?: string;
  colorB?: string;
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const data = seriesA.length >= seriesB.length ? seriesA : seriesB;
  if (!data.length) return null;

  const values = [...seriesA.map((d) => d.value), ...seriesB.map((d) => d.value)];
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = Math.max(maxVal - minVal, 1);
  const padding = { top: 20, right: 12, bottom: 28, left: 8 };
  const graphWidth = 480;
  const graphHeight = height - padding.top - padding.bottom;
  const viewBoxWidth = graphWidth + padding.left + padding.right;

  const toPoints = (series: DataPoint[]) =>
    series.map((d, i) => {
      const x =
        padding.left +
        (series.length === 1 ? graphWidth / 2 : (i / (series.length - 1)) * graphWidth);
      const y = padding.top + graphHeight - ((d.value - minVal) / range) * graphHeight;
      return { x, y, ...d };
    });

  const ptsA = toPoints(seriesA);
  const ptsB = toPoints(seriesB);
  const pathA = smoothPath(ptsA);
  const pathB = smoothPath(ptsB);

  return (
    <div className="relative w-full">
      <div className="mb-2 flex items-center gap-4 text-[10px] font-bold tracking-wide uppercase">
        <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full" style={{ background: colorA }} />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
          <span className="h-2 w-2 rounded-full" style={{ background: colorB }} />
          {labelB}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className="h-auto w-full select-none overflow-visible"
      >
        {data.map((d, i) => {
          const x =
            padding.left +
            (data.length === 1 ? graphWidth / 2 : (i / (data.length - 1)) * graphWidth);
          return (
            <g key={d.label}>
              <rect
                x={x - 14}
                y={padding.top}
                width={28}
                height={graphHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              />
              {i % 2 === 0 && (
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--muted-foreground)"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        <path d={pathA} fill="none" stroke={colorA} strokeWidth="2.5" strokeLinecap="round" />
        <path d={pathB} fill="none" stroke={colorB} strokeWidth="2.5" strokeLinecap="round" />
        {hovered !== null && ptsA[hovered] && (
          <>
            <circle cx={ptsA[hovered].x} cy={ptsA[hovered].y} r="4" fill={colorA} />
            {ptsB[hovered] && (
              <circle cx={ptsB[hovered].x} cy={ptsB[hovered].y} r="4" fill={colorB} />
            )}
          </>
        )}
      </svg>
      {hovered !== null && seriesA[hovered] && (
        <div className="pointer-events-none absolute top-8 right-2 rounded-xl bg-[#0b1220] px-3 py-2 text-xs text-white shadow-lg">
          <div className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">
            {seriesA[hovered].label}
          </div>
          <div className="mt-1 font-bold" style={{ color: colorA }}>
            {labelA}: ${seriesA[hovered].value.toLocaleString()}
          </div>
          {seriesB[hovered] && (
            <div className="font-bold" style={{ color: colorB }}>
              {labelB}: ${seriesB[hovered].value.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MiniSparkline({
  values,
  color = '#1d4ed8',
  positive = true,
}: {
  values: number[];
  color?: string;
  positive?: boolean;
}) {
  const path = useMemo(() => {
    if (values.length < 2) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);
    const w = 72;
    const h = 28;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return { x, y };
    });
    return smoothPath(pts);
  }, [values]);

  if (!path) return null;

  return (
    <svg viewBox="0 0 72 28" className="h-7 w-[72px] overflow-visible">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={positive ? 1 : 0.85}
      />
    </svg>
  );
}
