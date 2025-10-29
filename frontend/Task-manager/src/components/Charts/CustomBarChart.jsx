import React from 'react'; 
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from 'recharts';

const CustomBarChart = ({ data = [] }) => {

    const getBarColor=(entry)=>{
        switch(entry?.priority)
        {
            case "Low":
                return "#00BC7D";
            case "Medium":
                return "#FE9900";
            case "High":
                return "#FF1557";
            default:
                return "#8884d8";
        }
    };

    const CustomTooltip=({active,payload})=>{
        if(active && payload && payload.length)
        {
            return(
                <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg p-2 border border-gray-300 dark:border-slate-700">
                    <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">{payload[0].payload.priority}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        Count:{" "} <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{payload[0].payload.count}</span>
                    </p>
                </div>
            )
        }
        return null;
    }



    const hasData = Array.isArray(data) && data.length > 0;
    const chartData = hasData
      ? data.map(d => ({ priority: d.priority, count: Number(d?.count || 0) }))
      : [
          { priority: 'Low', count: 0 },
          { priority: 'Medium', count: 0 },
          { priority: 'High', count: 0 },
        ];

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const tickColor = isDark ? '#cbd5e1' : '#555';

    return (
        <div className="mt-6 w-full h-72">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }} barCategoryGap={24}>
                <CartesianGrid stroke="none" />
                <XAxis 
                dataKey="priority"
                tick={{ fill: tickColor, fontSize: 12 }}
                stroke="none"
                />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }}
                allowDecimals={false}
                domain={[0, 'dataMax + 1']}
                stroke="none"/>

                <Tooltip content={<CustomTooltip />} cursor={{fill:"transparent"}}/>
                
                <Bar dataKey={(d) => Number(d.count || 0)} name="Count" radius={[10,10,0,0]} barSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>

            </BarChart>
           </ResponsiveContainer>
        </div>
    )
};

export default CustomBarChart;