import React from "react";

const COLORS = ["#EAB308", "#F87171", "#60A5FA", "#34D399"];
const LABELS = ["0-14d", "15-29d", "30-59d", "60+d"];

export default function AgingDonutChart({ data }: { data: number[] }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return (
    <div className="bg-[#181818] rounded-lg p-6 shadow border border-gray-800 w-80 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Inventory Aging</h3>
      <svg width="120" height="120" viewBox="0 0 42 42" className="mb-4">
        {data.map((val, i) => {
          const r = 16;
          const c = 2 * Math.PI * r;
          const pct = val / total;
          const dash = pct * c;
          const gap = c - dash;
          const offset = c * acc;
          acc += pct;
          return (
            <circle
              key={i}
              r={r}
              cx={21}
              cy={21}
              fill="none"
              stroke={COLORS[i]}
              strokeWidth={6}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              style={{ transition: "stroke-dasharray 0.3s" }}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-2 w-full">
        {data.map((val, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
            <span className="text-gray-200 w-16">{LABELS[i]}</span>
            <span className="text-gray-400">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
