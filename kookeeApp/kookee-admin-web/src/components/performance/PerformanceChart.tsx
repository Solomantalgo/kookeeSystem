import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import type { PerformanceMetrics } from '../../types';

interface PerformanceChartProps {
    data: PerformanceMetrics[] | undefined;
    metric?: 'completion' | 'revenue';
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
    data = [],
    metric = 'completion'
}) => {
    const chartData = data.map(rep => ({
        name: rep.name,
        value: metric === 'completion' ? (rep.completion_rate || 0) : (rep.total_revenue || 0),
    }));

    const formatYAxis = (value: number) => {
        if (metric === 'revenue') {
            return `UGX ${(value / 1000).toFixed(0)}k`;
        }
        return `${value}%`;
    };

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        height={60}
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                        formatter={(value: number | string) => {
                            const numValue = typeof value === 'string' ? parseFloat(value) : value;
                            return [
                                metric === 'revenue'
                                    ? `UGX ${numValue.toLocaleString()}`
                                    : `${numValue.toFixed(1)}%`,
                                metric === 'revenue' ? 'Revenue' : 'Completion Rate'
                            ];
                        }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={metric === 'completion' ? '#3B82F6' : '#10B981'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
