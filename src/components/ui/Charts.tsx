'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  gradientId?: string;
}

export function AreaChart({
  data,
  height = 250,
  color = '#0f766e',
  gradientId = 'chart-gradient',
}: AreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const range = maxVal - minVal;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const graphWidth = 500;
  const graphHeight = height - padding.top - padding.bottom;
  const viewBoxWidth = graphWidth + padding.left + padding.right;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * graphWidth;
    const normalizedY = range > 0 ? (d.value - minVal) / range : 0.5;
    const y = padding.top + graphHeight - normalizedY * graphHeight;
    return { x, y, ...d };
  });

  const linePath =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`
    : '';

  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const ratio = i / 3;
    const y = padding.top + ratio * graphHeight;
    const val = maxVal - ratio * range;
    return { y, val };
  });

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} className="h-auto w-full select-none overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={padding.left + graphWidth}
              y2={line.y}
              stroke="rgba(14,26,22,0.08)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 12}
              y={line.y + 4}
              fill="#7a8a83"
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
                y={padding.top + graphHeight + 20}
                fill="#7a8a83"
                fontSize="10"
                fontWeight="500"
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
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        )}

        {linePath && (
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
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
              width={graphWidth / (data.length - 1 || 1)}
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
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity={0.7}
                />
                <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke={color} strokeWidth="3" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="pointer-events-none absolute rounded-lg border border-[var(--border)] bg-white p-3 text-xs shadow-lg"
          style={{
            left: `${((points[hoveredIndex].x - padding.left) / graphWidth) * 80 + 10}%`,
            top: '10px',
          }}
        >
          <div className="mb-0.5 font-medium text-[var(--muted)]">{points[hoveredIndex].label}</div>
          <div className="text-sm font-bold text-teal-800">
            ${points[hoveredIndex].value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
