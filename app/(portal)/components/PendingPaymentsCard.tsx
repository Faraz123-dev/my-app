import React from "react";

export default function PendingPaymentsCard({ count }: { count: number }) {
  return (
    <div className="bg-[#181818] rounded-lg p-6 shadow border border-gray-800 w-full max-w-md flex flex-col items-center justify-center min-h-[120px]">
      <h3 className="text-lg font-semibold text-yellow-400 mb-2">Pending Payments</h3>
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-3xl">🪙</span>
          <span>No pending payments!</span>
        </div>
      ) : (
        <span className="text-2xl font-bold text-yellow-400">{count}</span>
      )}
    </div>
  );
}
