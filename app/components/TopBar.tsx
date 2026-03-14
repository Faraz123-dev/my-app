import React from "react";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-gray-800 bg-[#181818]">
      <div />
      <div className="flex gap-3">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg shadow transition-colors">Truck</button>
        <button className="bg-[#232323] hover:bg-[#333] text-yellow-400 font-semibold px-4 py-2 rounded-lg shadow transition-colors">Profit Sim</button>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg shadow transition-colors">New Intake</button>
      </div>
    </header>
  );
}
