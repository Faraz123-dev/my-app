import React from "react";

type AgingTruck = {
  vin: string;
  make: string;
  model: string;
  year: number;
  days: number;
};

export default function AgingInventoryTable({ trucks }: { trucks: AgingTruck[] }) {
  return (
    <div className="bg-[#181818] rounded-lg p-6 shadow border border-gray-800 w-full max-w-2xl">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">Aging Inventory (30+ days)</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-yellow-400">
            <th className="px-3 py-2 text-left font-semibold">VIN</th>
            <th className="px-3 py-2 text-left font-semibold">Year</th>
            <th className="px-3 py-2 text-left font-semibold">Make</th>
            <th className="px-3 py-2 text-left font-semibold">Model</th>
            <th className="px-3 py-2 text-left font-semibold">Days</th>
          </tr>
        </thead>
        <tbody>
          {trucks.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-400">No aging inventory.</td>
            </tr>
          ) : (
            trucks.map((truck) => (
              <tr key={truck.vin} className="border-b border-gray-800">
                <td className="px-3 py-2 font-mono">{truck.vin}</td>
                <td className="px-3 py-2">{truck.year}</td>
                <td className="px-3 py-2">{truck.make}</td>
                <td className="px-3 py-2">{truck.model}</td>
                <td className={`px-3 py-2 font-bold ${truck.days >= 60 ? 'text-red-500' : 'text-yellow-400'}`}>{truck.days}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
