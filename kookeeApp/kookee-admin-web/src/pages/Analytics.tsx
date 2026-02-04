import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Calendar, ChevronDown, Download, Users, Map as MapIcon, TrendingUp } from 'lucide-react';
import { MetricCard } from '../components/performance/MetricCard';

// Mock Data Types
interface RouteAnalytics {
    route_name: string;
    visit_count: number;
    efficiency_score: number;
    revenue: number;
}

interface HourlyActivity {
    hour: string;
    visits: number;
    orders: number;
}

const Analytics: React.FC = () => {
    const [dateRange, setDateRange] = useState('This Week');

    // Mock Data
    const routeData: RouteAnalytics[] = [
        { route_name: 'Downtown', visit_count: 145, efficiency_score: 92, revenue: 1250000 },
        { route_name: 'North Ind.', visit_count: 98, efficiency_score: 78, revenue: 890000 },
        { route_name: 'East Retail', visit_count: 112, efficiency_score: 85, revenue: 1050000 },
        { route_name: 'West Suburbs', visit_count: 84, efficiency_score: 65, revenue: 620000 },
        { route_name: 'Central Biz', visit_count: 130, efficiency_score: 89, revenue: 1540000 },
    ];

    const hourlyData: HourlyActivity[] = [
        { hour: '8am', visits: 12, orders: 5 },
        { hour: '9am', visits: 45, orders: 15 },
        { hour: '10am', visits: 89, orders: 32 },
        { hour: '11am', visits: 112, orders: 45 },
        { hour: '12pm', visits: 78, orders: 28 },
        { hour: '1pm', visits: 65, orders: 22 },
        { hour: '2pm', visits: 95, orders: 38 },
        { hour: '3pm', visits: 88, orders: 35 },
        { hour: '4pm', visits: 56, orders: 20 },
        { hour: '5pm', visits: 23, orders: 8 },
    ];

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Analytics</h1>
                    <p className="text-gray-500 font-medium text-sm">Comprehensive insights into route efficiency and operational trends</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm hover:bg-gray-50 shadow-sm transition-all">
                        <Calendar size={16} className="text-gray-500" />
                        <span>{dateRange}</span>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                        <Download size={16} />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Top Level Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value="UGX 5.4M"
                    subtitle="Vs UGX 4.8M last week"
                    icon="💰"
                    trend={+12.5}
                />
                <MetricCard
                    title="Active Routes"
                    value="5"
                    subtitle="100% operational"
                    icon="root" // Custom icon handling in MetricCard might be needed or just generic emoji
                    iconComponent={<MapIcon size={24} className="text-blue-500" />}
                    trend={0}
                />
                <MetricCard
                    title="Avg Efficiency"
                    value="82%"
                    subtitle="Route completion rate"
                    icon="check"
                    iconComponent={<TrendingUp size={24} className="text-green-500" />}
                    trend={+4.2}
                />
                <MetricCard
                    title="Total Visits"
                    value="645"
                    subtitle="Across all routes"
                    icon="users"
                    iconComponent={<Users size={24} className="text-purple-500" />}
                    trend={+8.1}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Route Efficiency Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Route Performance</h3>
                            <p className="text-xs text-gray-400 font-medium">Revenue vs Efficiency Score</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={routeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="route_name"
                                    tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(val) => `UGX ${(val / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(val) => `${val}%`}
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar yAxisId="right" dataKey="efficiency_score" name="Efficiency" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hourly Activity Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Hourly Activity</h3>
                            <p className="text-xs text-gray-400 font-medium">Visits vs Orders throughout the day</p>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="visits" stroke="#3B82F6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={3} />
                                <Area type="monotone" dataKey="orders" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Alerts & Exceptions Analysis (Placeholder for now) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Operational Exceptions</h3>
                        <p className="text-xs text-gray-400 font-medium">Alerts triggered by type</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Placeholder Mini Charts */}
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xl">12</div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Off-Route Alerts</p>
                            <p className="text-xs text-red-500 font-medium">+2 from yesterday</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xl">5</div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Long Duration Visits</p>
                            <p className="text-xs text-orange-500 font-medium">-1 from yesterday</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center font-bold text-xl">3</div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">GPS Signal Loss</p>
                            <p className="text-xs text-yellow-500 font-medium">Stable</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
