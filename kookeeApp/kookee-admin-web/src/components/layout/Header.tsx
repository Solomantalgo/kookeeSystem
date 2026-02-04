import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Calendar, Search, Bell, User, Menu } from 'lucide-react';
import { DashboardSelector } from '../DashboardSelector';

interface HeaderProps {
    onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { selectedDate, setSelectedDate } = useDashboard();

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-4 lg:px-8 z-30 sticky top-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-gray-50 rounded-lg lg:hidden"
                >
                    <Menu size={24} className="text-gray-600" />
                </button>

                <div className="hidden lg:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 w-64 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <Search className="text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search team..."
                        className="bg-transparent border-none outline-none ml-2 w-full text-xs font-bold text-gray-700 placeholder:text-gray-400 uppercase"
                    />
                </div>

                <div>
                    <DashboardSelector />
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-6">
                {/* Mobile Search/Mode Toggles can go here if needed */}

                <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 border border-gray-100 rounded-lg sm:rounded-xl px-2 lg:px-3 py-1.5 hover:bg-white transition-all cursor-pointer">
                    <Calendar size={14} className="text-blue-600 flex-shrink-0" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] sm:text-xs font-black text-gray-800 cursor-pointer uppercase tracking-tight w-20 sm:w-auto"
                    />
                </div>

                <div className="h-6 w-[1px] bg-gray-100 hidden lg:block"></div>

                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all relative">
                        <Bell size={18} className="sm:w-5 sm:h-5" />
                        <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                    </button>

                    <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <User size={18} className="sm:w-5 sm:h-5" />
                    </div>
                </div>
            </div>
        </header>
    );
};
