import React from 'react';

const CustomToolTip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-2 border border-gray-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">{payload[0].name || label}</p>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Count: <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomToolTip;