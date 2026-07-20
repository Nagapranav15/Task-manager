import React from 'react';
import{
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import CustomToolTip from './CustomToolTip';
import CustomLegend from './CustomLegend';

const CustomPieChart = ({ data = [], colors = [] }) => {
    const validData = Array.isArray(data) ? data : [];
    const totalCount = validData.reduce((acc, item) => acc + (Number(item.count) || 0), 0);

    const chartData = totalCount > 0 
        ? validData.filter(item => Number(item.count) > 0)
        : [{ status: "No Tasks", count: 1 }];

    const chartColors = totalCount > 0
        ? colors
        : ['#94a3b8'];

    return (
        <div className="w-full h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                    <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={65}
                        labelLine={false}
                        className="text-white dark:text-[#070a13]"
                        stroke="currentColor"
                        strokeWidth={3.5}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors.length ? chartColors[index % chartColors.length] : '#8884d8'} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomToolTip />} />
                    <Legend content={<CustomLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


export default CustomPieChart;