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
    return(
        <div className="w-full h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 48, left: 8 }}>
                    <Pie
                    data={data}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={65}
                    labelLine={false}
                    stroke="#070a13"
                    strokeWidth={3.5}
                    >
                        {data?.map((entry,index)=>(
                            <Cell key={`cell-${index}`} fill={colors.length ? colors[index%colors.length] : '#8884d8'}/>
                        ))}
                    </Pie>
                    <Tooltip content={<CustomToolTip />} />
                    <Legend content={<CustomLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}


export default CustomPieChart;