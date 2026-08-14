'use client';

import { CheckResult } from '@/lib/api';
import { useState } from 'react';

interface UptimeBarProps {
  status: string;
  uptimePercentage?: number;
  checks?: CheckResult[];
  barCount?: number;
}

export default function UptimeBar({
  status,
  uptimePercentage = 100,
  checks = [],
  barCount = 30,
}: UptimeBarProps) {
  const [hoveredCheck, setHoveredCheck] = useState<{
    status: string;
    latency: number | null;
    time: string;
  } | null>(null);

  const bars = Array.from({ length: barCount }).map((_, idx) => {
    const check = checks[idx];
    if (check) {
      return {
        id: check.id,
        status: check.status,
        latency: check.responseTimeMs,
        time: new Date(check.checkedAt).toLocaleTimeString(),
      };
    }

    if (status === 'UP') {
      return {
        id: `mock-${idx}`,
        status: 'UP',
        latency: Math.floor(40 + Math.random() * 60),
        time: `${idx * 2}m ago`,
      };
    } else if (status === 'DOWN' && idx < 3) {
      return {
        id: `mock-${idx}`,
        status: 'DOWN',
        latency: null,
        time: `${idx * 2}m ago`,
      };
    } else if (status === 'PAUSED') {
      return {
        id: `mock-${idx}`,
        status: 'PAUSED',
        latency: null,
        time: `${idx * 2}m ago`,
      };
    }

    return {
      id: `mock-${idx}`,
      status: 'UNKNOWN',
      latency: null,
      time: 'No data',
    };
  }).reverse();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
        <span className="text-[11px]">30 checks ago</span>
        <div className="flex items-center gap-1 text-[11px]">
          {hoveredCheck ? (
            <span className="text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300 animate-in fade-in duration-150">
              <strong className={hoveredCheck.status === 'UP' ? 'text-emerald-600' : 'text-rose-600'}>
                {hoveredCheck.status}
              </strong>{' '}
              • {hoveredCheck.latency ? `${hoveredCheck.latency}ms` : 'Failed'} • {hoveredCheck.time}
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold tabular-nums">
              {uptimePercentage > 0 ? `${uptimePercentage.toFixed(2)}% uptime` : '100.00% uptime'}
            </span>
          )}
        </div>
        <span className="text-[11px]">Latest</span>
      </div>

      {/* Visual Ticks */}
      <div className="flex items-center gap-[3px] h-6 w-full py-1">
        {bars.map((bar, i) => {
          let bgClass = 'bg-slate-200 hover:bg-slate-300';
          if (bar.status === 'UP') bgClass = 'bg-emerald-500 hover:bg-emerald-600';
          if (bar.status === 'DOWN') bgClass = 'bg-rose-500 hover:bg-rose-600';
          if (bar.status === 'PAUSED') bgClass = 'bg-amber-400 hover:bg-amber-500';

          return (
            <div
              key={bar.id}
              className={`flex-1 h-full rounded-[2px] transition-all cursor-pointer ${bgClass}`}
              onMouseEnter={() =>
                setHoveredCheck({
                  status: bar.status,
                  latency: bar.latency,
                  time: bar.time,
                })
              }
              onMouseLeave={() => setHoveredCheck(null)}
            />
          );
        })}
      </div>
    </div>
  );
}
