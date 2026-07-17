import React from 'react';

const CustomToolTip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const name = payload[0].name || label;
    const value = payload[0].value;
    const badgeColor = name === "Completed" ? "text-emerald-400" : name === "In-Progress" || name === "In Progress" ? "text-cyan-400" : "text-indigo-400";
    
    return (
      <div className="bg-slate-950/80 backdrop-blur-md shadow-2xl rounded-xl p-3 border border-slate-800 text-left">
        <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${badgeColor}`}>{name}</p>
        <p className="text-xs text-slate-300">
          Tasks: <span className="text-slate-100 font-extrabold">{value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomToolTip;