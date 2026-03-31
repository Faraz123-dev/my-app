import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtext?: string;
};

function StatCard({ label, value, icon, color = "text-yellow-400", subtext }: StatCardProps) {
  return (
    <div className="flex flex-col bg-[#181818] rounded-lg px-6 py-4 min-w-[180px] shadow border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={`text-xl ${color}`}>{icon}</span>}
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </div>
      <span className="text-sm text-gray-300 font-medium">{label}</span>
      {subtext && <span className="text-xs text-gray-500 mt-1">{subtext}</span>}
    </div>
  );
}

export default function StatCards({
  inStock,
  cashTiedUp,
  pendingPayments,
  thisMonthProfit,
}: {
  inStock: number;
  cashTiedUp: number;
  pendingPayments: number;
  thisMonthProfit: number;
}) {
  return (
    <div className="flex gap-6 flex-wrap mb-8">
      <StatCard label="In Stock" value={inStock} />
      <StatCard label="Cash Tied Up" value={`$${cashTiedUp.toLocaleString()}`} />
      <StatCard label="Pending Payments" value={pendingPayments} />
      <StatCard label="This Month Profit" value={`$${thisMonthProfit.toLocaleString()}`} color={thisMonthProfit >= 0 ? "text-green-400" : "text-red-400"} />
    </div>
  );
}
