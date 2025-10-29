import React from 'react';
const InfoCard = ({icon,label,value,color}) => {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2 md:w-2 h-3 md:h-5 ${color} rounded-full`} />
            <div>
                <p className="text-[11px] md:text-[12px] text-gray-500 dark:text-slate-400">{label}</p>
                <p className="text-sm md:text-[15px] text-black dark:text-white font-semibold">{value}</p>
            </div>
        </div>
    );
};

export default InfoCard;
