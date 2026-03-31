import React from "react";
import { FaTruck, FaChartBar, FaPlusCircle } from "react-icons/fa";

const navItems = [
  { label: "Dashboard", icon: <FaChartBar />, href: "/" },
  { label: "Inventory", icon: <FaTruck />, href: "/inventory" },
];

export default function Sidebar({ active = "Dashboard" }: { active?: string }) {
  return (
    <aside className="bg-[#0f0f0f] w-64 min-h-screen flex flex-col border-r border-gray-800">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-gray-800">
        <span className="text-yellow-400 text-2xl font-bold tracking-tight">Aamir&Sons</span>
      </div>
      <nav className="flex-1 px-2 py-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 font-medium transition-colors text-lg ${
              active === item.label
                ? "bg-yellow-400 text-black shadow"
                : "text-gray-200 hover:bg-[#181818]"
            }`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
