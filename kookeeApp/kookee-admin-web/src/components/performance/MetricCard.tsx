import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon?: string;
    iconComponent?: React.ReactNode;
    trend?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    iconComponent,
    trend,
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                {iconComponent ? iconComponent : <span className="text-2xl">{icon}</span>}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
            {trend !== undefined && (
                <div className="flex items-center mt-3">
                    <span className={`flex items-center text-sm font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400 ml-2">vs last week</span>
                </div>
            )}
        </div>
    );
};
