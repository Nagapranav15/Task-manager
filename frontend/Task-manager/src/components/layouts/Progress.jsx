import React from "react";  

const Progress = ({ progress = 0, status }) => {
  const normStatus = typeof status === 'string' ? status : '';
  const getColor = () => {
    switch (normStatus) {
      case "In-Progress":
      case "In Progress":
        return "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500";
      case "Completed":
        return "bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500";
      case "Blocked":
        return "bg-gradient-to-r from-rose-500 via-pink-500 to-red-500";
      default:
        return "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400";
    }
  };

  const numVal = typeof progress === 'number' 
    ? progress 
    : parseInt(String(progress || 0).replace('%', ''), 10) || 0;
  const widthStr = `${Math.max(0, Math.min(100, numVal))}%`;

  return (
    <div className="w-full">
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-300/60 dark:border-slate-700/80 p-0.5 shadow-inner">
        <div
          className={`${getColor()} h-full rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: widthStr }}
        />
      </div>
    </div>
  );
};

export default Progress;
