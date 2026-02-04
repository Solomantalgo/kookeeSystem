import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, MapPin, TrendingUp, BarChart3, LogOut, AlertCircle, Users } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface SidebarProps {
    onClose?: () => void;
}

// Custom type for Nav Items with optional header capability
type NavItem = {
    path?: string;
    label: string;
    icon?: React.ReactNode;
    isHeader?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', isHeader: true },
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/alerts', label: 'Alerts', icon: <AlertCircle size={20} /> },

    { label: 'Sales', isHeader: true },
    { path: '/sales', label: 'Sales Home', icon: <LayoutDashboard size={20} /> },
    { path: '/sales/live-tracking', label: 'Live Tracking', icon: <MapPin size={20} /> },
    { path: '/sales/routes', label: 'Route Management', icon: <MapPin size={20} /> },
    { path: '/sales/agents', label: 'Sales Agents', icon: <Users size={20} /> },

    { label: 'Merchandiser', isHeader: true },
    { path: '/merchandisers', label: 'Merchandisers', icon: <Users size={20} /> },
    { path: '/outlets', label: 'Outlets', icon: <MapPin size={20} /> },
    { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { path: '/stock-matrix', label: 'Stock Matrix', icon: <BarChart3 size={20} /> },
    { path: '/assign', label: 'Assign Outlets', icon: <AlertCircle size={20} /> },
    { path: '/missing', label: 'Missing Reports', icon: <AlertCircle size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const { mode, setMode } = useDashboard();
    return (
        <div className="w-full bg-gray-900 text-white flex flex-col h-screen overflow-hidden">
            <div className="p-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-blue-500">KOOKEE <span className="text-white">ADMIN</span></h1>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Ops & Monitoring</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
                >
                    <X size={20} className="text-gray-400" />
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item, index) => (
                    item.isHeader ? (
                        <div key={`header-${index}`} className="px-4 py-2 mt-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {item.label}
                        </div>
                    ) : (
                        <NavLink
                            key={item.path}
                            to={item.path!}
                            onClick={() => onClose && onClose()}
                            end={item.path === '/sales' || item.path === '/dashboard'} // Exact match for Dashboards
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={`mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="font-semibold text-sm">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    )
                ))}
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <button
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all duration-200 font-bold text-sm"
                    onClick={() => {
                        localStorage.removeItem('admin_token');
                        window.location.href = '/login';
                    }}
                >
                    <LogOut size={16} />
                    <span>Logout System</span>
                </button>
            </div>
        </div>
    );
};
