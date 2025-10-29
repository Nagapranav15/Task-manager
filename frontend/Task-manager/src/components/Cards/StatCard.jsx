import React from "react";

const StatCard = ({ label = "", count = 0, status = "" }) => {
  const getStatusTagColor = () => {
    switch (status) {
      case "Pending":
        return "text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/40";
      case "In Progress":
        return "text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-900/40";
      case "Completed":
        return "text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/40";
      case "Overdue":
        return "text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900/40";
      default:
        return "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/40";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-md shadow-gray-100/40 dark:shadow-black/20 border border-gray-200/70 dark:border-slate-800 h-full">
      <div className="flex flex-col items-center text-center gap-1">
        <p className="text-[11px] text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">{count}</p>
        {status ? (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusTagColor()}`}>
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
