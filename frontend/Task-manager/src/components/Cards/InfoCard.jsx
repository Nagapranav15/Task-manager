import React from 'react';

const InfoCard = ({icon,label,value,color}) => {
    return (
        <div className="flex items-center gap-3.5 bg-white dark:bg-slate-950/20 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-sm transition-all duration-200">
            <div className={`w-1.5 h-8 ${color} rounded-full shadow-[0_0_10px_currentColor]`} />
            <div>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-base text-slate-800 dark:text-slate-100 font-extrabold mt-0.5">{value}</p>
            </div>
        </div>
    );
};

export default InfoCard;

