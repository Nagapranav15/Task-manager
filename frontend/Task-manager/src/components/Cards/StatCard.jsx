import React from "react";

const StatCard = ({ label = "", count = 0, status = "" }) => {
  const getStatusTagColor = () => {
    switch (status) {
      case "Pending":
        return "text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25";
      case "In Progress":
        return "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/25";
      case "Completed":
        return "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25";
      case "Overdue":
        return "text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25";
      default:
        return "text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/25";
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/30 backdrop-blur-md rounded-xl p-3 border border-slate-200 dark:border-slate-800/80 h-full flex flex-col items-center justify-center text-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{count}</p>
      {status ? (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusTagColor()}`}>
          {status}
        </span>
      ) : null}
    </div>
  );
};

export default StatCard;

