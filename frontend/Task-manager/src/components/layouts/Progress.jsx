import React from "react";  

const Progress = ({ progress = 0, status }) => {
  const normStatus = typeof status === 'string' ? status : '';
  const getColor = () => {
    switch (normStatus) {
      case "In-Progress":
      case "In Progress":
        return "bg-gradient-to-r from-cyan-500 to-blue-500";
      case "Completed":
        return "bg-gradient-to-r from-emerald-500 to-teal-400";
      case "Blocked":
        return "bg-gradient-to-r from-rose-500 to-pink-500";
      default:
        return "bg-gradient-to-r from-amber-500 to-indigo-500";
    }
  };

  const width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;

  return (
    <div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-300/50 dark:border-slate-700/50 p-0.5">
        <div
          className={`${getColor()} h-full rounded-full transition-all duration-300`}
          style={{ width }}
        />
      </div>
    </div>
  );
};

export default Progress
