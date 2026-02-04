import React from 'react';
import type { PerformanceMetrics } from '../../types';

interface TeamLeaderboardProps {
    data: PerformanceMetrics[];
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ data }) => {
    const sortedData = [...data].sort((a, b) => b.efficiency_score - a.efficiency_score);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Efficiency Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest uppercase">
                            <th className="px-6 py-3">Rank</th>
                            <th className="px-6 py-3">Salesperson</th>
                            <th className="px-6 py-3 text-center">Visits</th>
                            <th className="px-6 py-3 text-center">Revenue</th>
                            <th className="px-6 py-3 text-right">Efficiency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedData.map((rep: PerformanceMetrics, index) => (
                            <tr key={rep.user_id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'text-gray-400'
                                        }`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{rep.name}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <p className="text-sm font-semibold text-gray-700">{rep.completed_visits} / {rep.total_visits}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{rep.completion_rate.toFixed(0)}%</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <p className="text-sm font-bold text-gray-900">UGX {rep.total_revenue.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${rep.efficiency_score >= 90 ? 'bg-green-100 text-green-700' :
                                        rep.efficiency_score >= 75 ? 'bg-blue-100 text-blue-700' :
                                            rep.efficiency_score >= 60 ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {rep.efficiency_score}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
