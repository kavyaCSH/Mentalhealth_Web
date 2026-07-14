import React from 'react';

interface Ring {
    progress: number; // 0 to 1
    color: string;
    radius: number;
    strokeWidth?: number;
    id: string;
}

interface CircularProgressProps {
    size?: number;
    centerValue?: string;
    centerLabel?: string;
    rings: Ring[];
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    size = 150,
    centerValue,
    centerLabel,
    rings
}) => {
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {rings.map((ring) => {
                    const circumference = ring.radius * 2 * Math.PI;
                    const strokeDashoffset = circumference - ring.progress * circumference;
                    const strokeWidth = ring.strokeWidth || 12;

                    return (
                        <React.Fragment key={ring.id}>
                            {/* Background ring */}
                            <circle
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                r={ring.radius}
                                cx={size / 2}
                                cy={size / 2}
                                className="text-slate-100 opacity-20"
                            />
                            {/* Progress ring */}
                            <circle
                                stroke={ring.color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                fill="transparent"
                                r={ring.radius}
                                cx={size / 2}
                                cy={size / 2}
                                style={{
                                    strokeDasharray: circumference,
                                    strokeDashoffset,
                                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            />
                        </React.Fragment>
                    );
                })}
            </svg>
            
            {(centerValue || centerLabel) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {centerValue && (
                        <span className="text-2xl font-black text-main leading-none">
                            {centerValue}
                        </span>
                    )}
                    {centerLabel && (
                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mt-1">
                            {centerLabel}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default CircularProgress;
