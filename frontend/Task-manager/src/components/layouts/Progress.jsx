import React from "react";  

const Progress = ({ progress = 0, status }) => {
  const normStatus = typeof status === 'string' ? status : '';
  const getColor = () => {
    switch (normStatus) {
      case "In-Progress":
      case "In Progress":
        return "bg-cyan-500";
      case "Completed":
        return "bg-indigo-500";
      default:
        return "bg-violet-500";
    }
  };

  const width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;

  return (
    <div>
      <div className="w-full bg-gray-200/70 rounded-full h-1.5">
        <div
          className={`${getColor()} h-1.5 rounded-full`}
          style={{ width }}
        />
      </div>
    </div>
  );
};

export default Progress
