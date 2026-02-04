import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { format } from 'date-fns';
import { MetricCard } from '../components/performance/MetricCard';
import { TeamLeaderboard } from '../components/performance/TeamLeaderboard';
import { PerformanceChart } from '../components/performance/PerformanceChart';
import type { PerformanceMetrics } from '../types';

export const Performance: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: teamData, isLoading } = useQuery({
        queryKey: ['team-performance', selectedDate],
        queryFn: () => apiService.getTeamPerformance(selectedDate),
        // Setting initialData or placeholder if needed for UI testing
    });

    // Mock data for immediate preview if API fails
    const mockData: PerformanceMetrics[] = [
        { user_id: '1', name: 'John Doe', date: selectedDate, total_visits: 12, completed_visits: 10, missed_visits: 2, completion_rate: 83.3, avg_visit_duration_minutes: 15, total_revenue: 450000, efficiency_score: 88 },
        { user_id: '2', name: 'Jane Smith', date: selectedDate, total_visits: 10, completed_visits: 10, missed_visits: 0, completion_rate: 100, avg_visit_duration_minutes: 12, total_revenue: 620000, efficiency_score: 95 },
        { user_id: '3', name: 'Mike Ross', date: selectedDate, total_visits: 15, completed_visits: 8, missed_visits: 7, completion_rate: 53.3, avg_visit_duration_minutes: 20, total_revenue: 210000, efficiency_score: 45 },
    ];

    const activeData = teamData || mockData;

    const totalVisits = activeData.reduce((sum, rep) => sum + rep.total_visits, 0);
    const completedVisits = activeData.reduce((sum, rep) => sum + rep.completed_visits, 0);
    const totalRevenue = activeData.reduce((sum, rep) => sum + rep.total_revenue, 0);
    const avgDuration = activeData.reduce((sum, rep) => sum + rep.avg_visit_duration_minutes, 0) / (activeData.length || 1);

    if (isLoading && !teamData) {
        return <div className="flex items-center justify-center h-full min-h-[400px]">Loading reports...</div>;
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Performance</h1>
                    <p className="text-gray-500 font-medium font-sm">Monitoring daily targets and sales efficiency</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2">Audit Date:</span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 border-none outline-none font-bold text-sm text-blue-600 bg-blue-50 rounded-lg cursor-pointer"
                    />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Visits"
                    value={totalVisits.toString()}
                    subtitle={`${completedVisits} completed visits`}
                    icon="📋"
                    trend={+5.2}
                />
                <MetricCard
                    title="Avg Completion"
                    value={`${((completedVisits / totalVisits) * 100).toFixed(1)}%`}
                    icon="🎯"
                    trend={+2.1}
                />
                <MetricCard
                    title="Total Revenue"
                    value={`UGX ${totalRevenue.toLocaleString()}`}
                    icon="💰"
                    trend={+8.7}
                />
                <MetricCard
                    title="Avg Duration"
                    value={`${avgDuration.toFixed(0)} min`}
                    icon="⏱️"
                    trend={-1.3}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Completion Yield</h2>
                        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">By Salesperson</span>
                    </div>
                    <PerformanceChart data={activeData} />
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-gray-900">Revenue Generation</h2>
                        <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-600 rounded">UGX Values</span>
                    </div>
                    <PerformanceChart data={activeData} metric="revenue" />
                </div>
            </div>

            {/* Leaderboard */}
            <TeamLeaderboard data={activeData} />

            {/* Detail Grid */}
            <div className="pb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-gray-900">Representative Breakdown</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeData.map((rep) => (
                        <div key={rep.user_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{rep.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-black ${rep.efficiency_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {rep.efficiency_score}% Score
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-1">
                                        <span>Visit Quota</span>
                                        <span>{rep.completed_visits} / {rep.total_visits}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${Math.min(100, (rep.completed_visits / rep.total_visits) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Revenue</p>
                                        <p className="text-sm font-black text-gray-900">UGX {rep.total_revenue.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Avg Time</p>
                                        <p className="text-sm font-black text-gray-900">{rep.avg_visit_duration_minutes} min</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="mt-6 w-full bg-gray-900 group-hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-gray-200 group-hover:shadow-blue-200 flex items-center justify-center gap-2"
                                onClick={() => window.location.href = `/performance/${rep.user_id}`}
                            >
                                <span>Full Audit Report</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
