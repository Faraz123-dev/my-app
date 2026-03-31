import React from "react";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function ProfitBarChart({ data }: { data: { month: string; profit: number }[] }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.profit)), 1);
  return (
    <div className="bg-[#181818] rounded-lg p-6 shadow border border-gray-800 w-full max-w-2xl">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Profit by Month</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => (
          <div key={d.month} className="flex flex-col items-center w-7">
            <div
              className={`w-full rounded-t ${d.profit >= 0 ? "bg-green-400" : "bg-red-400"}`}
              style={{ height: `${Math.abs(d.profit) / maxAbs * 100}%` }}
              title={`$${d.profit.toLocaleString()}`}
            />
            <span className="text-xs text-gray-400 mt-1">{d.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
