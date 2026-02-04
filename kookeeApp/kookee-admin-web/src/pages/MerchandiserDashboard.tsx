import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, Users as UsersIcon, Copy, Check, AlertCircle } from 'lucide-react';
import * as Clipboard from 'clipboard-polyfill';

import { AssignmentModal } from '../components/merchandiser/AssignmentModal';
import { ReportsList } from '../components/merchandiser/ReportsList';
import { apiService } from '../services/api';

interface Assignment {
    id: string;
    merchandiser: string;
    outlets: string[];
    date: string;
    status: 'pending' | 'completed';
}

export const MerchandiserDashboard: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

    // Fetch real dashboard stats
    const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['merchandiser-dashboard', selectedDate],
        queryFn: () => apiService.getMerchandiserDashboard(selectedDate),
        refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    });

    // Fetch assignments
    const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
        queryKey: ['assignments', selectedDate],
        queryFn: () => apiService.getAssignments(selectedDate),
    });

    const handleCopyWhatsApp = async (assignment: Assignment) => {
        const text = `📍 DAILY OUTLET ASSIGNMENT – ${new Date(assignment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
Outlets:
${assignment.outlets.map((outlet, i) => `${i + 1}. ${outlet}`).join('\n')}
Notes: Please complete all visits today.`;

        await Clipboard.writeText(text);
        setCopiedId(assignment.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Calculate stats from real data
    const reportsSubmitted = dashboardStats?.reports_submitted || 0;
    const reportsMissing = dashboardStats?.reports_missing || 0;
    const activeMerchandisers = dashboardStats?.active_merchandisers || 0;
    const outletsVisitedToday = dashboardStats?.outlets_visited_today || 0;

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Merchandiser Operations</h1>
                    <p className="text-gray-500 font-medium text-sm">Manage assignments, reports, and outlet coverage</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={() => setIsAssignmentModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Assignment
                    </button>
                </div>
            </div>

            {/* Stats Error Display */}
            {statsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-800 text-sm">Failed to load dashboard stats. Please check backend connection.</p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Reports Submitted</h3>
                        <Check size={20} className="text-green-500" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                        {statsLoading ? '...' : reportsSubmitted}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Today's submissions</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Missing Reports</h3>
                        <AlertCircle size={20} className="text-orange-500" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                        {statsLoading ? '...' : reportsMissing}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Pending submissions</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Active Merchandisers</h3>
                        <UsersIcon size={20} className="text-blue-500" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                        {statsLoading ? '...' : activeMerchandisers}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Working today</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Outlets Visited</h3>
                        <Calendar size={20} className="text-purple-500" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                        {statsLoading ? '...' : outletsVisitedToday}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Today's coverage</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignments List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h2 className="text-xl font-black text-gray-900">Recent Assignments</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="px-8 py-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-gray-900">{assignment.merchandiser}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${assignment.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {assignment.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(assignment.date).toLocaleDateString()}
                                            </span>
                                            <span>{assignment.outlets.length} outlets</span>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 font-semibold">Outlets:</p>
                                            <p className="text-sm text-gray-700">{assignment.outlets.join(', ')}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopyWhatsApp(assignment)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all font-semibold text-sm"
                                    >
                                        {copiedId === assignment.id ? (
                                            <>
                                                <Check size={16} />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={16} />
                                                <span>Copy WhatsApp</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reports List Side Panel */}
                <div className="h-full">
                    <ReportsList />
                </div>
            </div>

            <AssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
            />
        </div >
    );
};

