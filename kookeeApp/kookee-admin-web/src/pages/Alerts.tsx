import React from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Filter,
    Search,
    MoreVertical,
    MapPin,
    Clock,
    User
} from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';

export const Alerts: React.FC = () => {
    const { alerts, resolveAlert, isLoading } = useAlerts();

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center">Loading alerts...</div>;
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Alerts</h1>
                    <p className="text-gray-500 font-medium">Monitor and resolve operational exceptions</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search alerts..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm hover:bg-gray-50">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                    <button className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 shadow-lg">
                        Resolve All
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-black tracking-widest text-gray-400">
                                <th className="px-8 py-4">Severity</th>
                                <th className="px-8 py-4">Message</th>
                                <th className="px-8 py-4">Context</th>
                                <th className="px-8 py-4">Time</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                            {alerts.length > 0 ? (
                                alerts.map((alert) => (
                                    <tr key={alert.alert_id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${alert.severity === 'high'
                                                    ? 'bg-red-100 text-red-700'
                                                    : alert.severity === 'medium'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                                                    }`}>
                                                    <AlertCircle size={18} />
                                                </div>
                                                <span className="font-bold text-gray-900">{alert.message}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <User size={12} />
                                                    <span>User ID: {alert.user_id}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <MapPin size={12} />
                                                    <span>GPS Logic Triggered</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={16} className="text-gray-300" />
                                                <span className="text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => resolveAlert(alert.alert_id)}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm"
                                                >
                                                    Resolve
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle2 size={48} className="text-green-300 mb-4" />
                                            <p className="text-xl font-black text-gray-900 mb-1">Queue is Clear</p>
                                            <p className="text-gray-500 font-medium">All operational exceptions have been resolved.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
