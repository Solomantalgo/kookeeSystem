import React from 'react';
import {
    CheckCircle2,
    Clock,
    ArrowUpRight,
    AlertTriangle,
    Plus,
    Users,
    Calendar,
    AlertCircle,
    LayoutGrid,
    FileText,
    ClipboardList,
    Store
} from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { useLiveLocations } from '../hooks/useLiveLocations';
import { MetricCard } from '../components/performance/MetricCard';
import { useDashboard } from '../context/DashboardContext';
import { Alert } from '../types';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const { mode, selectedDate } = useDashboard();
    const { alerts, resolveAlert } = useAlerts();
    const { locations } = useLiveLocations();



    const activeAlerts = alerts.filter(a => !a.resolved).slice(0, 5);
    const activeReps = locations.filter(l => l.status !== 'idle');

    // Sales Metrics
    const salesMetrics = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/tracking" className="block transform hover:scale-[1.02] transition-all">
                <MetricCard
                    title="Active Field Reps"
                    value={activeReps.length.toString()}
                    subtitle={`Out of ${locations.length} total staff`}
                    iconComponent={<CheckCircle2 size={24} className="text-blue-500" />}
                    trend={+2}
                />
            </Link>
            <Link to="/performance" className="block transform hover:scale-[1.02] transition-all">
                <MetricCard
                    title="Daily Revenue"
                    value="UGX 1.2M"
                    subtitle="On track for target"
                    iconComponent={<ArrowUpRight size={24} className="text-green-500" />}
                    trend={+12.5}
                />
            </Link>
            <Link to="/performance" className="block transform hover:scale-[1.02] transition-all">
                <MetricCard
                    title="Route Completion"
                    value="84.2%"
                    subtitle="Average across all repos"
                    iconComponent={<Clock size={24} className="text-purple-500" />}
                    trend={+4.1}
                />
            </Link>
            <Link to="/alerts" className="block transform hover:scale-[1.02] transition-all">
                <MetricCard
                    title="Critical Alerts"
                    value={alerts.filter(a => a.severity === 'high' && !a.resolved).length.toString()}
                    subtitle="Requires attention"
                    iconComponent={<AlertCircle size={24} className="text-red-500" />}
                    trend={-1}
                />
            </Link>
        </div>
    );

    // Merchandiser Navigation Grid (Redesigned per Request)
    const merchandiserNavigation = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/merchandisers" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Merchandisers</h3>
                <p className="text-gray-500 text-sm font-medium">Manage staff and profiles</p>
            </Link>

            <Link to="/outlets" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Store size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Outlets</h3>
                <p className="text-gray-500 text-sm font-medium">View and manage locations</p>
            </Link>

            <Link to="/reports" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-green-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Reports</h3>
                <p className="text-gray-500 text-sm font-medium">Daily submission logs</p>
            </Link>

            <Link to="/stock-matrix" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LayoutGrid size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Stock Matrix</h3>
                <p className="text-gray-500 text-sm font-medium">Consolidated stock view</p>
            </Link>

            <Link to="/assign" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ClipboardList size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Assign Outlets</h3>
                <p className="text-gray-500 text-sm font-medium">Task and route planning</p>
            </Link>

            <Link to="/missing" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Missing Reports</h3>
                <p className="text-gray-500 text-sm font-medium">Urgent follow-ups needed</p>
            </Link>
        </div>
    );

    return (
        <div className="p-4 lg:p-8 space-y-8 bg-gray-50/50 min-h-screen relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
                        {mode === 'sales' ? 'Sales Monitoring' : 'Merchandiser Ops'}
                    </h1>
                    <p className="text-gray-500 font-medium text-sm lg:text-base">
                        {mode === 'sales'
                            ? 'Real-time representative tracking and performance'
                            : 'Assignment tracking and reporting analytics'
                        }
                    </p>
                </div>
                <div className="text-xs font-black text-gray-400 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    <span>{new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            <div className="space-y-6 lg:space-y-8">
                {mode === 'sales' ? salesMetrics : merchandiserNavigation}
            </div>

            {mode === 'sales' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-500" />
                            Critical Sales Alerts
                        </h2>
                        <div className="space-y-3">
                            {activeAlerts.map((alert: Alert) => (
                                <div key={alert.alert_id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={20} /></div>
                                        <div>
                                            <p className="font-black text-gray-900 text-sm lg:text-base">{alert.message}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{new Date(alert.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => resolveAlert(alert.alert_id)} className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all hover:bg-black active:scale-95 shadow-lg shadow-gray-200 uppercase tracking-wider">Acknowledge</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-fit">
                        <h3 className="font-black text-gray-400 mb-8 uppercase text-[10px] tracking-[0.2em]">Quick Sales Ops</h3>
                        <div className="space-y-3">
                            <Link to="/tracking" className="w-full text-left p-5 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group block">
                                <p className="font-black text-gray-800">📍 Live Track</p>
                                <p className="text-[10px] text-gray-400 font-bold group-hover:text-blue-500 transition-colors uppercase tracking-widest mt-1">Map monitoring</p>
                            </Link>
                            <Link to="/performance" className="w-full text-left p-5 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group block">
                                <p className="font-black text-gray-800">📊 Team Performance</p>
                                <p className="text-[10px] text-gray-400 font-bold group-hover:text-blue-500 transition-colors uppercase tracking-widest mt-1">Yield reports</p>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button for Merchandiser Mode */}
            {mode === 'merchandiser' && (
                <Link
                    to="/assign"
                    className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group z-40"
                >
                    <Plus size={32} className="group-hover:rotate-90 transition-transform" />
                </Link>
            )}
        </div>
    );
};
