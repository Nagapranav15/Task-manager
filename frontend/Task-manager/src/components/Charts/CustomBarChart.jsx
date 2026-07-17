import React from 'react'; 
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from 'recharts';

const CustomBarChart = ({ data = [] }) => {
    const getBarColor = (entry) => {
        switch(entry?.priority) {
            case "Low":
                return "url(#colorLow)";
            case "Medium":
                return "url(#colorMedium)";
            case "High":
                return "url(#colorHigh)";
            default:
                return "#8884d8";
        }
    };

    const getBarStroke = (entry) => {
        switch(entry?.priority) {
            case "Low": return "#10b981";
            case "Medium": return "#f59e0b";
            case "High": return "#f43f5e";
            default: return "#8884d8";
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const p = payload[0].payload;
            const priorityColor = p.priority === "Low" ? "text-emerald-400" : p.priority === "Medium" ? "text-amber-400" : "text-rose-400";
            return (
                <div className="bg-slate-950/80 backdrop-blur-md shadow-2xl rounded-xl p-3 border border-slate-800 text-left">
                    <p className={`text-xs font-bold tracking-wider uppercase mb-1 ${priorityColor}`}>{p.priority} Priority</p>
                    <p className="text-xs text-slate-300">
                        Tasks: <span className="text-slate-100 font-extrabold">{p.count}</span>
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

    const tickColor = '#94a3b8'; // slate-400

    return (
        <div className="mt-4 w-full h-72">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 8, left: -20 }} barCategoryGap={20}>
                <defs>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.25} />
                <XAxis 
                    dataKey="priority"
                    tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                    stroke="none"
                />
                <YAxis 
                    tick={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
                    allowDecimals={false}
                    domain={[0, 'dataMax + 1']}
                    stroke="none"
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 10 }} />
                
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry)} 
                        stroke={getBarStroke(entry)} 
                        strokeWidth={1.5}
                    />
                  ))}
                </Bar>
            </BarChart>
           </ResponsiveContainer>
        </div>
    )
};

export default CustomBarChart;