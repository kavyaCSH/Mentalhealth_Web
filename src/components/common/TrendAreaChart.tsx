import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
    label: string;
    value: number;
}

interface TrendAreaChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
}

const TrendAreaChart: React.FC<TrendAreaChartProps> = ({
    data,
    height = 200,
    color = '#6366f1'
}) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.value), 10);
    const min = Math.min(...data.map(d => d.value), 0);
    const range = max - min;
    
    const width = 1000; // Fixed Coordinate system width
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${points} ${width},${height} 0,${height}`;

    return (
        <div className="w-full" style={{ height }}>
            <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                    <line
                        key={p}
                        x1="0"
                        y1={p * height}
                        x2={width}
                        y2={p * height}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                    />
                ))}

                {/* Area */}
                <motion.polygon
                    points={areaPoints}
                    fill="url(#areaGradient)"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Line */}
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Data Points */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - ((d.value - min) / range) * height;
                    return (
                        <motion.circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="white"
                            stroke={color}
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                        />
                    );
                })}
            </svg>
            
            <div className="flex justify-between mt-4">
                {data.map((d, i) => (
                    <span key={i} className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default TrendAreaChart;
